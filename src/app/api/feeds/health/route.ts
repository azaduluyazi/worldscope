import { NextResponse } from "next/server";
import { getFeedHealthSummary } from "@/lib/db/feed-health";
import { cachedFetch, TTL } from "@/lib/cache/redis";

export const runtime = "nodejs";

/**
 * GET /api/feeds/health — Feed health monitoring summary.
 * Returns aggregated stats about feed status across all categories.
 */
export async function GET() {
  try {
    const health = await cachedFetch(
      "feeds:health:summary",
      () => getFeedHealthSummary(),
      TTL.THREAT // 5 minutes
    );

    return NextResponse.json({
      ...health,
      timestamp: new Date().toISOString(),
      feedDatabaseSize: 536, // Total seed feeds configured (updated Faz 9+10)
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch feed health" },
      { status: 500 }
    );
  }
}
