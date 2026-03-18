import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchVesselPositions } from "@/lib/api/marine-ais";

export const runtime = "nodejs";

const CACHE_TTL = 300; // 5 minutes — vessel positions change slowly

/** GET /api/vessels — maritime vessel positions along major shipping lanes */
export async function GET() {
  try {
    const vessels = await cachedFetch(
      "tracking:vessels",
      fetchVesselPositions,
      CACHE_TTL
    );

    return NextResponse.json({
      vessels,
      total: vessels.length,
      lastUpdated: new Date().toISOString(),
      source: "Maritime AIS Network",
    });
  } catch {
    return NextResponse.json(
      { vessels: [], total: 0, lastUpdated: new Date().toISOString() },
      { status: 500 }
    );
  }
}
