import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/cache/redis";
import type { Convergence, ConvergenceResponse } from "@/lib/convergence/types";
import { fetchRecentValidations } from "@/lib/convergence/predictions-store";
import { fetchRecentHistory } from "@/lib/db/convergence-history";
import { CONVERGENCE_KEYS } from "@/lib/cache/keys";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/convergence
 * Returns cached convergence results.
 *
 * READ PATH (two-tier with DB fallback):
 *   1. Try Redis key `convergence:latest` (written by the 5-min cron).
 *      This is the happy path — hot cache, ~2ms read.
 *   2. If Redis is empty (cron skipped a cycle, TTL expired mid-gap,
 *      or this is a fresh deploy), fall back to convergence_history
 *      with a 15-minute window. The history table is written at the
 *      END of every cron run, so it's the authoritative snapshot of
 *      what the pipeline has produced recently.
 *
 * This avoids the previous failure mode where `cachedFetch` would
 * write an empty default back to Redis on a cache miss, poisoning
 * the cache for an entire 5-minute TTL window even after the cron
 * recovered. The new path NEVER writes from the read endpoint —
 * the cron is the only writer for convergence:latest.
 *
 * Query params: minConfidence (0.0-1.0), region (e.g. "ME", "EU")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minConfidence = parseFloat(searchParams.get("minConfidence") || "0.4");
    const region = searchParams.get("region");

    // Tier 1: Redis hot cache
    let data = await redis.get<ConvergenceResponse>(CONVERGENCE_KEYS.latest);
    let source: "redis" | "history" = "redis";

    // Tier 2: DB fallback when Redis is empty. Uses a 15-minute
    // window so we surface the freshest cron result regardless of
    // where we are in the 5-min cycle.
    if (!data || data.convergences.length === 0) {
      const recent: Convergence[] = await fetchRecentHistory({
        daysBack: 1,
        minConfidence: 0.4,
        limit: 200,
      });
      // Trim to rows from the last 15 minutes so stale history
      // doesn't masquerade as the current cycle.
      const cutoff = Date.now() - 15 * 60 * 1000;
      const fresh = recent.filter(
        (c) => new Date(c.createdAt).getTime() >= cutoff
      );
      if (fresh.length > 0) {
        data = {
          convergences: fresh,
          metadata: {
            totalSignalsAnalyzed: fresh.length,
            convergencesFound: fresh.length,
            timestamp: new Date().toISOString(),
          },
        };
        source = "history";
      }
    }

    // Still nothing — return an empty response WITHOUT touching Redis.
    if (!data) {
      data = {
        convergences: [],
        metadata: {
          totalSignalsAnalyzed: 0,
          convergencesFound: 0,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Apply filters
    let filtered = data.convergences.filter(
      (c) => c.confidence >= minConfidence
    );

    if (region) {
      filtered = filtered.filter((c) =>
        c.affectedRegions.includes(region.toUpperCase())
      );
    }

    // Phase A.10 fix: surface recently-validated predictions alongside
    // the latest convergences. The UI shows them in a separate section
    // so users can see "we said X would happen, and it did".
    const recentValidations = await fetchRecentValidations();

    return NextResponse.json({
      status: "success",
      data: {
        convergences: filtered,
        recentValidations,
        metadata: {
          ...data.metadata,
          convergencesFound: filtered.length,
          recentValidationsCount: recentValidations.length,
          filters: { minConfidence, region },
          source,
        },
      },
    });
  } catch (error) {
    console.error("[convergence] API error:", error);
    return NextResponse.json(
      { status: "error", error: "Failed to fetch convergence data" },
      { status: 500 }
    );
  }
}
