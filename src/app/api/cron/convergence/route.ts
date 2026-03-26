import { NextResponse } from "next/server";
import { redis, TTL } from "@/lib/cache/redis";
import { fetchPersistedEvents } from "@/lib/db/events";
import { runFullConvergenceScan } from "@/lib/convergence/engine";
import type { ConvergenceResponse } from "@/lib/convergence/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET /api/cron/convergence
 * Runs every 5 minutes via Vercel Cron.
 * Fetches recent events from DB, runs full convergence scan,
 * and caches the results in Redis.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Fetch recent events from Supabase (last 6 hours)
    const events = await fetchPersistedEvents({
      hoursBack: 6,
      limit: 2000,
    });

    if (events.length === 0) {
      return NextResponse.json({
        status: "ok",
        message: "No recent events to analyze",
        duration: Date.now() - startTime,
      });
    }

    // Run full convergence scan (includes LLM narratives)
    const result: ConvergenceResponse = await runFullConvergenceScan(events, 6);

    // Cache results in Redis
    await redis.set("convergence:latest", result, { ex: TTL.FIVE_MIN });

    // Also persist high-confidence convergences to a history key
    if (result.convergences.length > 0) {
      const highConf = result.convergences.filter((c) => c.confidence >= 0.7);
      if (highConf.length > 0) {
        // Append to 24h rolling history
        const historyKey = "convergence:history";
        const existing = await redis.get<ConvergenceResponse["convergences"]>(historyKey) || [];
        const merged = [...highConf, ...existing].slice(0, 50); // Keep last 50
        await redis.set(historyKey, merged, { ex: 86400 }); // 24h TTL
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      status: "ok",
      eventsAnalyzed: events.length,
      convergencesFound: result.convergences.length,
      highConfidence: result.convergences.filter((c) => c.confidence >= 0.7).length,
      duration,
    });
  } catch (error) {
    console.error("[convergence-cron] Error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
