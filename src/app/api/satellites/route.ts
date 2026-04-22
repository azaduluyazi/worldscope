import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchSatellitePositions } from "@/lib/api/celestrak";

export const runtime = "nodejs";

/**
 * GET /api/satellites
 * Returns approximate satellite positions from CelesTrak TLE data.
 */
export async function GET() {
  try {
    const data = await cachedFetch(
      "satellites:positions",
      async () => {
        const satellites = await fetchSatellitePositions();
        return {
          satellites,
          total: satellites.length,
          lastUpdated: new Date().toISOString(),
        };
      },
      120 // 2 min cache
    );

    return NextResponse.json(data);
  } catch (err) {
    console.error("[satellites]", err);
    return NextResponse.json({ satellites: [], total: 0, lastUpdated: new Date().toISOString() });
  }
}
