import type { IntelItem, Category } from "@/types/intel";
import type { ClusterEvent } from "./types";
import type { CorrelationGroup } from "./correlation-detector";
import { getBulkReliability } from "./source-reliability";
import { getTimeWindowForSet, CATEGORY_TIME_WINDOWS } from "./time-windows";
import { computeEventEmbeddings } from "./semantic-similarity";
import { cosineSimilarity } from "./embedding";
import {
  type TopicTrackMetrics,
  emptyTopicMetrics,
  classifyTopicFailure,
} from "./track-metrics";

// ═══════════════════════════════════════════════════════════════════
//  Topic Detector — geo-sparse event clustering via semantic similarity
// ═══════════════════════════════════════════════════════════════════
//
//  WHY THIS EXISTS
//  ───────────────
//  The geographic detector (correlation-detector.ts) uses Haversine
//  distance + time window + category diversity to cluster events. But
//  it REQUIRES lat/lng on every event. That means 697 Reddit/YouTube/
//  HN/Bluesky events we pull every cycle contribute ZERO to
//  convergences — they're all geo-sparse and get filtered out before
//  any clustering runs.
//
//  This detector is the second track of a dual-track design:
//    - Geo track:   detectCorrelations()       — Haversine + time
//    - Topic track: detectTopicCorrelations()  — semantic + time
//
//  Together they cover the full event population. Geographic stories
//  (earthquakes, protests, aviation incidents) get geo-anchored
//  convergences; topical stories (Reddit discussions, YouTube news
//  analysis, HN tech threads, Bluesky trends) get topic-anchored
//  convergences.
//
//  ALGORITHM
//  ─────────
//  1. Filter input to events WITHOUT lat/lng in the lookback window.
//  2. Enrich with reliability (for tier metadata used by bayesian-
//     scorer's tier diversity bonus — this is where T4 social
//     signals FINALLY reach the scorer).
//  3. Embed all events via Gemini (uses the pgvector cache so only
//     new events pay the API cost).
//  4. Single-pass greedy clustering: seed with the earliest event,
//     pull in every later event that meets ALL three criteria:
//       (a) semantic similarity ≥ TOPIC_SIMILARITY_THRESHOLD
//       (b) time delta ≤ getTimeWindowForSet([seed.cat, cand.cat])
//       (c) not already claimed by an earlier cluster
//  5. Filter clusters to ones with ≥ MIN_TOPIC_EVENTS events and
//     ≥ MIN_TOPIC_CATEGORIES distinct categories (preserves the
//     "cross-category agreement" invariant that the Bayesian scorer
//     relies on).
//  6. Emit each surviving cluster as a CorrelationGroup with the
//     sentinel centroid {0, 0} and `isTopic: true` flag.
//
//  TUNING KNOBS
//  ────────────
//  TOPIC_SIMILARITY_THRESHOLD — 0.78 means "same general story"
//    (e.g. "Iran ceasefire" Reuters + "Iran ceasefire reaction"
//    Reddit). Raise to 0.85 for stricter "same event", lower to 0.72
//    for "same broad topic". 0.92 is our semantic-dedup threshold
//    in semantic-similarity.ts — we deliberately stay below that to
//    preserve diversity within clusters.
// ═══════════════════════════════════════════════════════════════════

const TOPIC_SIMILARITY_THRESHOLD = 0.78;
const MIN_TOPIC_EVENTS = 2;
const MIN_TOPIC_CATEGORIES = 2;

// Max lookback if caller doesn't specify — pick the slowest category
// so we don't accidentally exclude diplomacy (24h window).
const MAX_WINDOW_MS = Math.max(...Object.values(CATEGORY_TIME_WINDOWS));

/**
 * Detect topic-based correlations + report metrics.
 *
 * This is the instrumented version called by the engine. Returns
 * both the clusters and a TopicTrackMetrics counter snapshot that
 * explains what happened during this run. The snapshot gets written
 * to the convergence_metrics table so operators can answer "why 0
 * clusters?" with a single SQL query instead of reading code.
 *
 * Safe to call even if Gemini is down — computeEventEmbeddings
 * gracefully degrades to undefined embeddings. In that case the
 * metrics.failureReason will be "embedding_down", surfacing the
 * root cause immediately.
 */
export async function detectTopicCorrelationsWithMetrics(
  items: IntelItem[],
  hoursBack?: number
): Promise<{ clusters: CorrelationGroup[]; metrics: TopicTrackMetrics }> {
  const startedAt = Date.now();
  const metrics = emptyTopicMetrics();

  const lookbackMs = hoursBack ? hoursBack * 60 * 60 * 1000 : MAX_WINDOW_MS;
  const cutoff = startedAt - lookbackMs;

  // Step 1: filter to NON-geo events within the lookback window.
  // (Geo-tagged events are handled by the geographic track.)
  const nonGeoItems = items.filter(
    (item) =>
      (item.lat == null || item.lng == null) &&
      new Date(item.publishedAt).getTime() >= cutoff
  );

  metrics.eventsInput = nonGeoItems.length;

  if (nonGeoItems.length < MIN_TOPIC_EVENTS) {
    metrics.failureReason = "no_input";
    metrics.durationMs = Date.now() - startedAt;
    return { clusters: [], metrics };
  }

  // Step 2: enrich with reliability + tier
  const sourceIds = [...new Set(nonGeoItems.map((e) => e.source))];
  const reliabilityMap = getBulkReliability(sourceIds);

  const clusterEvents: ClusterEvent[] = nonGeoItems.map((item) => {
    const rel = reliabilityMap.get(item.source);
    return {
      eventId: item.id,
      sourceId: item.source,
      category: item.category,
      severity: item.severity,
      reliability: rel?.dynamicScore ?? 0.45,
      tier: rel?.tier ?? 3,
      title: item.title,
      lat: 0, // sentinel — signals "not real coordinates"
      lng: 0,
      publishedAt: item.publishedAt,
    };
  });

  // Step 3: compute embeddings (uses pgvector cache)
  const embedded = await computeEventEmbeddings(clusterEvents);

  metrics.eventsWithEmbedding = embedded.filter((e) => !!e.embedding).length;
  metrics.eventsSkippedNoEmbedding =
    embedded.length - metrics.eventsWithEmbedding;

  // Step 4: single-pass greedy clustering, sorted by time
  const sorted = [...embedded].sort(
    (a, b) =>
      new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );

  const clusters: ClusterEvent[][] = [];
  const claimed = new Set<string>();

  for (let i = 0; i < sorted.length; i++) {
    const seed = sorted[i];
    if (claimed.has(seed.eventId)) continue;
    if (!seed.embedding) continue; // graceful degrade if embedding failed

    const cluster: ClusterEvent[] = [seed];
    claimed.add(seed.eventId);
    const seedTime = new Date(seed.publishedAt).getTime();

    for (let j = i + 1; j < sorted.length; j++) {
      const cand = sorted[j];
      if (claimed.has(cand.eventId)) continue;
      if (!cand.embedding) continue;

      // Time window (category-aware) — seed.cat + cand.cat pair
      const pairWindow = getTimeWindowForSet([seed.category, cand.category]);
      const candTime = new Date(cand.publishedAt).getTime();
      if (candTime - seedTime > pairWindow) {
        // Sorted by time: once we pass the window, all remaining
        // candidates are also too late.
        break;
      }

      // Semantic similarity check
      const sim = cosineSimilarity(seed.embedding, cand.embedding);
      if (sim < TOPIC_SIMILARITY_THRESHOLD) continue;

      cluster.push(cand);
      claimed.add(cand.eventId);
    }

    // Step 5: filter small or single-category clusters
    if (cluster.length < MIN_TOPIC_EVENTS) {
      metrics.clustersDroppedMinSize += 1;
      continue;
    }
    const uniqueCats = new Set(cluster.map((e) => e.category));
    if (uniqueCats.size < MIN_TOPIC_CATEGORIES) {
      metrics.clustersDroppedSingleCategory += 1;
      continue;
    }

    clusters.push(cluster);
  }

  // Step 6: convert to CorrelationGroup[]
  const result: CorrelationGroup[] = clusters.map((events) => {
    const categories = [...new Set(events.map((e) => e.category))] as Category[];
    const times = events.map((e) => new Date(e.publishedAt).getTime());
    return {
      events,
      centroid: { lat: 0, lng: 0 }, // sentinel — NOT a real location
      categories,
      timeSpan: {
        start: new Date(Math.min(...times)).toISOString(),
        end: new Date(Math.max(...times)).toISOString(),
      },
      isTopic: true,
    };
  });

  metrics.clustersProduced = result.length;
  metrics.durationMs = Date.now() - startedAt;

  if (result.length === 0) {
    metrics.failureReason = classifyTopicFailure(metrics);
  }

  return { clusters: result, metrics };
}

/**
 * Backward-compatible wrapper: returns clusters only (without metrics).
 * Existing call sites + tests use this. New callers (engine.ts) should
 * prefer detectTopicCorrelationsWithMetrics so they can persist the
 * metrics snapshot.
 */
export async function detectTopicCorrelations(
  items: IntelItem[],
  hoursBack?: number
): Promise<CorrelationGroup[]> {
  const { clusters } = await detectTopicCorrelationsWithMetrics(items, hoursBack);
  return clusters;
}
