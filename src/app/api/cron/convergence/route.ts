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
import { recordBothTrackMetrics } from "@/lib/db/convergence-metrics";
import type { TrackMetrics } from "@/lib/convergence/track-metrics";
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
import { CONVERGENCE_KEYS } from "@/lib/cache/keys";

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
    // 1) Fetch recent events from Supabase for BOTH convergence tracks.
    //
    // Dual fetch rationale: the geo track (Haversine clustering) needs
    // events with lat/lng, while the topic track (semantic similarity)
    // needs non-geo events — RSS/Reddit/HN/YouTube items whose signal
    // comes from text embeddings, not coordinates. A single fetch with
    // geoOnly:true starves the topic track (eventsInput=0, observed
    // in convergence_metrics rows prior to this fix).
    //
    // We fire two parallel queries — one for each track's input
    // population — and concatenate the results. This preserves the
    // 1000-row Supabase API cap on BOTH axes independently: ~131 geo
    // events + up to 1000 non-geo events, instead of one pool where
    // non-geo RSS items crowd out the few geo rows.
    //
    // 48h lookback covers the longest forward-prediction window
    // (diplomacy = 24h) plus a grace buffer.
    const [geoEvents, nonGeoEvents] = await Promise.all([
      fetchPersistedEvents({ hoursBack: 48, limit: 1000, geoOnly: true }),
      fetchPersistedEvents({ hoursBack: 48, limit: 1000, nonGeoOnly: true }),
    ]);
    const events = [...geoEvents, ...nonGeoEvents];

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

    // ═══════════════════════════════════════════════════════════════
    //  CRITICAL PATH — write observability and user-visible state
    //  BEFORE any of the slow downstream steps (storyline attachment,
    //  prediction validation, counter-factual scans, archiving).
    //
    //  Rationale: the topic track went from 0 to 27 clusters per
    //  cycle, which pushed the cron's total wall time dangerously
    //  close to the 60s Vercel maxDuration. When a downstream step
    //  throws or hangs, the OLD ordering killed the entire cron
    //  before metrics rows, Redis cache, and history archive were
    //  written — producing 18-minute observability blackouts and
    //  empty /api/convergence responses.
    //
    //  The new ordering is:
    //    2a) metrics row        (observability)
    //    2b) Redis cache        (UI hot path)
    //    2c) history archive    (API DB fallback + backtesting)
    //    3+)  storylines, predictions, counter-factuals, housekeeping
    //
    //  Everything below step 2c is best-effort and can silently
    //  fail without user-visible impact.
    // ═══════════════════════════════════════════════════════════════

    // 2a) Persist per-track observability counters to convergence_metrics.
    // Fail-open: repository swallows DB errors so this cannot break the
    // rest of the cron. The point is: NEXT query to that table answers
    // "why did we produce N clusters?" without reading code.
    const collectedMetrics = (result.trackMetrics ?? []) as TrackMetrics[];
    if (collectedMetrics.length > 0) {
      await recordBothTrackMetrics(collectedMetrics);
    }

    // 2b) Cache convergence results in Redis BEFORE any slow step.
    // /api/convergence reads this key first and falls back to
    // convergence_history on miss (both sources stay consistent via
    // the early-write in 2c).
    await redis.set(CONVERGENCE_KEYS.latest, result, { ex: TTL.MEDIUM });

    // 2c) Persist convergences to the permanent history archive.
    // Done BEFORE storylines/predictions/counter-factuals so the API
    // DB fallback always sees fresh data even if later steps crash.
    const historyWritten = await persistConvergences(result.convergences);

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
      await redis.set(CONVERGENCE_KEYS.counterFactuals, counterFactuals, {
        ex: TTL.STATIC,
      });
    } else {
      // Clear stale CF cache so the UI doesn't show ghosts
      await redis.del(CONVERGENCE_KEYS.counterFactuals);
    }

    // 5d) Persist NEW predictions from this cycle for next run
    let predictionsStored = 0;
    for (const conv of result.convergences) {
      if (conv.predictions && conv.predictions.length > 0) {
        await storePredictions(conv.id, conv.predictions);
        predictionsStored += conv.predictions.length;
      }
    }

    // NOTE: convergence:latest Redis write and history archive
    // already happened in steps 2b/2c above the slow downstream
    // work. Do NOT re-write here — duplicating the write would
    // undo any storyline tagging that happened in step 3.

    // Re-persist convergences now that storylineId is attached
    // (upsert on id so the initial step-2c row is updated in place).
    if (result.convergences.length > 0) {
      await persistConvergences(result.convergences);
      await redis.set(CONVERGENCE_KEYS.latest, result, { ex: TTL.MEDIUM });
    }

    // Append high-confidence convergences to the rolling history key
    if (result.convergences.length > 0) {
      const highConf = result.convergences.filter((c) => c.confidence >= 0.7);
      if (highConf.length > 0) {
        const historyKey = CONVERGENCE_KEYS.history;
        const existing =
          (await redis.get<ConvergenceResponse["convergences"]>(historyKey)) || [];
        const merged = [...highConf, ...existing].slice(0, 50);
        await redis.set(historyKey, merged, { ex: 86400 });
      }
    }

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

    // Compact per-track summary for live monitoring. Full counter
    // snapshots are persisted to convergence_metrics; this is a
    // curl-friendly subset that tells you "WHY did each track produce
    // what it did?" without a SQL query.
    const tracks = collectedMetrics.map((m) => ({
      track: m.track,
      eventsInput: m.eventsInput,
      clustersProduced: m.clustersProduced,
      failureReason: m.failureReason,
      durationMs: m.durationMs,
      ...(m.track === "topic"
        ? {
            eventsWithEmbedding: m.eventsWithEmbedding,
            eventsSkippedNoEmbedding: m.eventsSkippedNoEmbedding,
          }
        : {
            geoClustersFound: m.geoClustersFound,
            temporalGroupsFound: m.temporalGroupsFound,
          }),
    }));

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
      tracks,
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
