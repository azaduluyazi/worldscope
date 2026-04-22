import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchOrefAlerts } from "@/lib/api/tzevaadom";

export const runtime = "nodejs";

/**
 * GET /api/oref — High-frequency Israel rocket alert polling.
 * 30 second cache to avoid abusing Tzevaadom API.
 */
export async function GET() {
  try {
    const alerts = await cachedFetch(
      "oref:alerts",
      () => fetchOrefAlerts(50),
      30
    );

    return NextResponse.json({
      alerts,
      total: alerts.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[oref]", err);
    return NextResponse.json({ alerts: [], total: 0, lastUpdated: new Date().toISOString() });
  }
}
