import { NextResponse } from "next/server";
import { redis, TTL } from "@/lib/cache/redis";
import { fetchPersistedEvents } from "@/lib/db/events";
import {
  runFullConvergenceScan,
  attachConvergencesToStorylines,
} from "@/lib/convergence/engine";
import {
  fetchActiveStorylines,
  upsertStoryline,
  archiveExpired,
} from "@/lib/db/storylines";
import {
  persistConvergences,
  purgeOldHistory,
} from "@/lib/db/convergence-history";
import {
  storePredictions,
  fetchActivePredictions,
  validateAndCleanup,
} from "@/lib/convergence/predictions-store";
import { detectCounterFactuals } from "@/lib/convergence/counter-factual";
import { getBulkReliability } from "@/lib/convergence/source-reliability";
import { getCalibratedPrior } from "@/lib/convergence/calibration";
import type { ConvergenceResponse } from "@/lib/convergence/types";
import type { ClusterEvent } from "@/lib/convergence/types";

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
 *
 * v2 pipeline:
 *   1. Fetch recent events from Supabase
 *   2. Run full convergence scan (semantic + Bayesian + predictions)
 *   3. Attach to active storylines (or create new ones)
 *   4. Persist storylines to Supabase
 *   5. Cache convergence response in Redis
 *   6. Archive expired storylines (housekeeping)
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // 1) Fetch recent events from Supabase
    // Use a 48h lookback to cover the longest forward-prediction window
    // (diplomacy = 24h) plus a grace buffer. The correlation detector
    // still uses category-aware windows internally.
    const events = await fetchPersistedEvents({
      hoursBack: 48,
      limit: 8000,
    });

    if (events.length === 0) {
      return NextResponse.json({
        status: "ok",
        message: "No recent events to analyze",
        duration: Date.now() - startTime,
      });
    }

    // 2) Run full convergence scan with runtime-calibrated prior.
    // The calibration cron (weekly) updates this value based on
    // telemetry CTR buckets. Falls back to 0.30 default if empty.
    const calibratedPrior = await getCalibratedPrior();
    const result: ConvergenceResponse = await runFullConvergenceScan(events, undefined, {
      priorOverride: calibratedPrior,
    });

    // 3) Attach convergences to active storylines
    let storylinesUpserted = 0;
    if (result.convergences.length > 0) {
      const activeStorylines = await fetchActiveStorylines(100);
      const { convergences: tagged, storylinesToUpsert } =
        attachConvergencesToStorylines(result.convergences, activeStorylines);
      result.convergences = tagged;

      // 4) Persist storylines (only the ones touched this cycle)
      const touchedIds = new Set(tagged.map((c) => c.storylineId).filter(Boolean));
      for (const story of storylinesToUpsert) {
        if (touchedIds.has(story.id)) {
          await upsertStoryline(story);
          storylinesUpserted++;
        }
      }
    }

    // 5a) Build cluster events ONCE for downstream validation/CF use
    const reliabilityForAll = getBulkReliability(
      [...new Set(events.map((e) => e.source))]
    );
    const clusterEventsForValidation: ClusterEvent[] = events
      .filter((e) => e.lat != null && e.lng != null)
      .map((item) => ({
        eventId: item.id,
        sourceId: item.source,
        category: item.category,
        severity: item.severity,
        reliability: reliabilityForAll.get(item.source)?.dynamicScore ?? 0.45,
        title: item.title,
        lat: item.lat!,
        lng: item.lng!,
        publishedAt: item.publishedAt,
      }));

    // 5b) Validate previous-cycle predictions against current events.
    // This is the FIX for the v3 critical gap: predictions stored in
    // the previous cycle are now actually checked against new events
    // and either marked validated, expired (counter-factual), or kept.
    const previousActivePreds = await fetchActivePredictions();
    const validation = await validateAndCleanup(
      previousActivePreds,
      clusterEventsForValidation
    );

    // 5c) Counter-factual scan over the EXPIRED predictions (those
    // that timed out without ever matching). The detector also looks
    // at still-pending high-prob predictions for early warnings.
    const counterFactuals = detectCounterFactuals(
      [...validation.expired, ...validation.stillPending],
      clusterEventsForValidation
    );
    if (counterFactuals.length > 0) {
      await redis.set("convergence:counter-factuals", counterFactuals, {
        ex: TTL.STATIC,
      });
    } else {
      // Clear stale CF cache so the UI doesn't show ghosts
      await redis.del("convergence:counter-factuals");
    }

    // 5d) Persist NEW predictions from this cycle for next run
    let predictionsStored = 0;
    for (const conv of result.convergences) {
      if (conv.predictions && conv.predictions.length > 0) {
        await storePredictions(conv.id, conv.predictions);
        predictionsStored += conv.predictions.length;
      }
    }

    // 5c) Cache convergence results in Redis
    await redis.set("convergence:latest", result, { ex: TTL.MEDIUM });

    // Append high-confidence convergences to the rolling history key
    if (result.convergences.length > 0) {
      const highConf = result.convergences.filter((c) => c.confidence >= 0.7);
      if (highConf.length > 0) {
        const historyKey = "convergence:history";
        const existing =
          (await redis.get<ConvergenceResponse["convergences"]>(historyKey)) || [];
        const merged = [...highConf, ...existing].slice(0, 50);
        await redis.set(historyKey, merged, { ex: 86400 });
      }
    }

    // 6a) Persist convergences to the permanent history archive.
    // This is the data backbone for backtesting, calibration, and
    // storyline drilldown. Migration 011 created the table.
    const historyWritten = await persistConvergences(result.convergences);

    // 6b) Housekeeping: archive expired storylines (cheap RPC call)
    const archived = await archiveExpired();

    // 6c) History pruning — only run every ~2 hours (24 cycles) to
    // avoid hitting Supabase on every 5-minute tick. Use cycle minute
    // mod check as a cheap rate limiter.
    const cycleMinute = new Date().getMinutes();
    let historyPurged = 0;
    if (cycleMinute === 0) {
      historyPurged = await purgeOldHistory();
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      status: "ok",
      eventsAnalyzed: events.length,
      convergencesFound: result.convergences.length,
      highConfidence: result.convergences.filter((c) => c.confidence >= 0.7).length,
      storylinesUpserted,
      storylinesArchived: archived,
      historyWritten,
      historyPurged,
      predictionsStored,
      predictionsValidated: validation.validated.length,
      predictionsExpired: validation.expired.length,
      predictionsStillPending: validation.stillPending.length,
      counterFactualsFound: counterFactuals.length,
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
