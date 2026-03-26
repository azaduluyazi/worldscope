import { NextRequest, NextResponse } from "next/server";
import { cachedFetch, TTL } from "@/lib/cache/redis";
import type { ConvergenceResponse } from "@/lib/convergence/types";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/convergence
 * Returns cached convergence results.
 * Convergences are computed by the cron job every 5 minutes.
 * Query params: minConfidence (0.0-1.0), region (e.g. "ME", "EU")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minConfidence = parseFloat(searchParams.get("minConfidence") || "0.4");
    const region = searchParams.get("region");

    // Read from cache (populated by cron)
    const data = await cachedFetch<ConvergenceResponse>(
      "convergence:latest",
      async () => {
        // If cache is empty, return empty response
        // Cron will populate it on next run
        return {
          convergences: [],
          metadata: {
            totalSignalsAnalyzed: 0,
            convergencesFound: 0,
            timestamp: new Date().toISOString(),
          },
        };
      },
      TTL.FIVE_MIN
    );

    // Apply filters
    let filtered = data.convergences.filter(
      (c) => c.confidence >= minConfidence
    );

    if (region) {
      filtered = filtered.filter((c) =>
        c.affectedRegions.includes(region.toUpperCase())
      );
    }

    return NextResponse.json({
      status: "success",
      data: {
        convergences: filtered,
        metadata: {
          ...data.metadata,
          convergencesFound: filtered.length,
          filters: { minConfidence, region },
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
