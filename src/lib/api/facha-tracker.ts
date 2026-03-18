/**
 * Facha.dev — Open aircraft and ship tracking API.
 * No API key required.
 * https://api.facha.dev/
 */
import type { AircraftState, VesselPosition } from "@/types/tracking";

interface FachaAircraft {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  velocity: number | null;
  true_track: number | null;
  vertical_rate: number | null;
  on_ground: boolean;
  squawk: string | null;
  last_contact: number;
}

interface FachaVessel {
  mmsi: string;
  name: string;
  ship_type: string;
  latitude: number;
  longitude: number;
  course: number | null;
  speed: number | null;
  heading: number | null;
  destination: string | null;
  flag: string | null;
  last_update: string;
}

const FACHA_API = "https://api.facha.dev";

/** Fetch tracked aircraft from Facha.dev */
export async function fetchFachaAircraft(): Promise<AircraftState[]> {
  try {
    const res = await fetch(`${FACHA_API}/v1/aircraft`, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "WorldScope/1.0" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const aircraft: FachaAircraft[] = Array.isArray(data)
      ? data
      : data?.aircraft || data?.states || [];

    return aircraft.slice(0, 100).map((a): AircraftState => ({
      icao24: a.icao24,
      callsign: a.callsign,
      originCountry: a.origin_country || "",
      longitude: a.longitude,
      latitude: a.latitude,
      altitude: a.baro_altitude,
      velocity: a.velocity,
      heading: a.true_track,
      verticalRate: a.vertical_rate,
      onGround: Boolean(a.on_ground),
      squawk: a.squawk,
      lastContact: a.last_contact || Date.now() / 1000,
      category: "unknown",
    }));
  } catch {
    return [];
  }
}

/** Fetch tracked vessels from Facha.dev */
export async function fetchFachaVessels(): Promise<VesselPosition[]> {
  try {
    const res = await fetch(`${FACHA_API}/v1/vessels`, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "WorldScope/1.0" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const vessels: FachaVessel[] = Array.isArray(data)
      ? data
      : data?.vessels || [];

    return vessels.slice(0, 100).map((v): VesselPosition => ({
      mmsi: v.mmsi,
      name: v.name || "Unknown",
      shipType: mapVesselType(v.ship_type),
      latitude: v.latitude,
      longitude: v.longitude,
      course: v.course,
      speed: v.speed,
      heading: v.heading,
      destination: v.destination,
      flag: v.flag,
      lastUpdate: v.last_update || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

function mapVesselType(type: string): VesselPosition["shipType"] {
  const t = (type || "").toLowerCase();
  if (t.includes("cargo")) return "cargo";
  if (t.includes("tanker")) return "tanker";
  if (t.includes("passenger")) return "passenger";
  if (t.includes("military") || t.includes("naval")) return "military";
  if (t.includes("fishing")) return "fishing";
  if (t.includes("tug")) return "tug";
  return "unknown";
}
