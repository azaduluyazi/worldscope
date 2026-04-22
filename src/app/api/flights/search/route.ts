import { NextRequest, NextResponse } from "next/server";
import { iataToCallsign } from "@/config/airlines";
import { getAirport } from "@/config/airports";
import { cachedFetch } from "@/lib/cache/redis";

export const runtime = "edge";

/**
 * GET /api/flights/search?q=TK1234 — Search for a flight by number.
 *
 * Uses OpenSky Network (free, no API key required):
 * 1. Convert IATA flight number to ICAO callsign
 * 2. Get route (origin/destination airports) via /api/routes
 * 3. Get live position via /api/states/all
 * 4. Look up airport coordinates from static database
 *
 * Returns: { flight, route, position }
 */

const OPENSKY_BASE = "https://opensky-network.org/api";

interface FlightSearchResult {
  callsign: string;
  route: {
    origin: { icao: string; name: string; city: string; lat: number; lng: number } | null;
    destination: { icao: string; name: string; city: string; lat: number; lng: number } | null;
  };
  position: {
    lat: number;
    lng: number;
    altitude: number | null;
    velocity: number | null;
    heading: number | null;
    onGround: boolean;
  } | null;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (!q || q.trim().length < 3) {
    return NextResponse.json(
      { error: "Flight number required (e.g., TK1234)" },
      { status: 400 }
    );
  }

  const callsign = iataToCallsign(q);

  try {
    const result = await cachedFetch<FlightSearchResult | null>(
      `flight:search:${callsign}`,
      async () => {
        // 1. Get route (origin/destination)
        let origin: FlightSearchResult["route"]["origin"] = null;
        let destination: FlightSearchResult["route"]["destination"] = null;

        try {
          const routeRes = await fetch(
            `${OPENSKY_BASE}/routes?callsign=${callsign}`,
            { signal: AbortSignal.timeout(8000) }
          );
          if (routeRes.ok) {
            const routeData = await routeRes.json();
            if (routeData.route?.length >= 2) {
              const origIcao = routeData.route[0];
              const destIcao = routeData.route[routeData.route.length - 1];
              const origAirport = getAirport(origIcao);
              const destAirport = getAirport(destIcao);

              if (origAirport) {
                origin = { icao: origIcao, name: origAirport.name, city: origAirport.city, lat: origAirport.lat, lng: origAirport.lng };
              }
              if (destAirport) {
                destination = { icao: destIcao, name: destAirport.name, city: destAirport.city, lat: destAirport.lat, lng: destAirport.lng };
              }
            }
          }
        } catch (err) {
          console.error("[flights/search]", err);
          // Route lookup failed — continue without it
        }

        // 2. Get live position
        let position: FlightSearchResult["position"] = null;

        try {
          // Pad callsign to 8 chars (OpenSky format)
          const paddedCallsign = callsign.padEnd(8);
          const stateRes = await fetch(
            `${OPENSKY_BASE}/states/all?callsign=${paddedCallsign}`,
            { signal: AbortSignal.timeout(8000) }
          );
          if (stateRes.ok) {
            const stateData = await stateRes.json();
            const states = stateData.states;
            if (states?.length > 0) {
              const s = states[0];
              position = {
                lat: s[6],
                lng: s[5],
                altitude: s[7], // barometric altitude in meters
                velocity: s[9], // ground speed in m/s
                heading: s[10], // true track in degrees
                onGround: s[8],
              };
            }
          }
        } catch (err) {
          console.error("[flights/search]", err);
          // Position lookup failed
        }

        // If we got nothing, return null
        if (!origin && !destination && !position) return null;

        return { callsign, route: { origin, destination }, position };
      },
      60 // 1 minute cache
    );

    if (!result) {
      return NextResponse.json(
        { error: `Flight ${q} (${callsign}) not found. It may not be airborne.` },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[flights/search]", err);
    return NextResponse.json(
      { error: "Flight search failed" },
      { status: 500 }
    );
  }
}
