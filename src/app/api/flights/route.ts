import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchGlobalAircraft } from "@/lib/api/opensky";
import { seedRead } from "@/lib/seed/seed-utils";

export const runtime = "nodejs";
export const maxDuration = 30;

const CACHE_TTL = 30; // 30 seconds — aircraft positions change rapidly

/** GET /api/flights — live aircraft positions from adsb.lol (military + LADD) */
export async function GET() {
  try {
    // Seed-first: try pre-populated cache
    const seeded = await seedRead<unknown[]>("seed:flights:opensky");
    if (seeded && seeded.length > 0) {
      return NextResponse.json({ aircraft: seeded, total: seeded.length, fromSeed: true });
    }

    const aircraft = await cachedFetch(
      "tracking:flights",
      fetchGlobalAircraft,
      CACHE_TTL
    );

    return NextResponse.json({
      aircraft,
      total: aircraft.length,
      lastUpdated: new Date().toISOString(),
      source: "adsb.lol",
    });
  } catch {
    return NextResponse.json(
      { aircraft: [], total: 0, lastUpdated: new Date().toISOString() },
      { status: 500 }
    );
  }
}
