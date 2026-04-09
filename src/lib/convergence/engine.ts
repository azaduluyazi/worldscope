import type { IntelItem, Category } from "@/types/intel";
import type {
  Convergence,
  ConvergenceSignal,
  ConvergenceResponse,
  ClusterEvent,
  ConvergencePrediction,
} from "./types";
import {
  detectCorrelationsWithMetrics,
  checkEventCorrelation,
  type CorrelationGroup,
} from "./correlation-detector";
import { detectTopicCorrelationsWithMetrics } from "./topic-detector";
import type { TrackMetrics } from "./track-metrics";
import { resolveImpactChain, classifyConvergence } from "./impact-chain";
import { calculateConvergenceConfidence, assignSignalRoles } from "./scorer";
import { batchGenerateNarratives } from "./narrative";
import { computeEventEmbeddings, deduplicateBySemantics } from "./semantic-similarity";
import { predictFollowups } from "./forward-prediction";
import {
  ttlByConfidence,
  attachToStoryline,
  createStoryline,
  type Storyline,
} from "./storyline";
import type { BayesianOptions } from "./bayesian-scorer";

// ═══════════════════════════════════════════════════════════════════
//  Convergence Engine v2 — Orchestrator
// ═══════════════════════════════════════════════════════════════════
//
//  v1 → v2 wiring summary:
//
//  detectCorrelations  → category-aware time + geo (Phase 1.6)
//        ↓
//  computeEventEmbeddings (NEW) → semantic enrichment (Phase 2)
//        ↓
//  deduplicateBySemantics (NEW) → kill near-dupe headlines (Phase 2)
//        ↓
//  buildConvergence
//        ↓ uses bayesianConfidence ← syndication ← temporal-decay
//        ↓                          (Phases 1.1, 1.3, 1.4)
//        ↓
//  predictFollowups (NEW)         → forward predictions (Phase 3)
//        ↓
//  ttlByConfidence (NEW)          → adaptive expiry (Phase 4)
//        ↓
//  batchGenerateNarratives        → LLM narrative (unchanged)
//
// ═══════════════════════════════════════════════════════════════════

// ── Country code inference from coordinates ────────────

function inferRegions(lat: number, lng: number): string[] {
  const regions: string[] = [];
  if (lat >= 25 && lat <= 42 && lng >= 25 && lng <= 60) regions.push("ME");
  if (lat >= 35 && lat <= 72 && lng >= -10 && lng <= 40) regions.push("EU");
  if (lat >= 25 && lat <= 50 && lng >= -130 && lng <= -60) regions.push("NA");
  if (lat >= -10 && lat <= 55 && lng >= 60 && lng <= 150) regions.push("AS");
  if (lat >= -35 && lat <= 37 && lng >= -20 && lng <= 55) regions.push("AF");
  if (lat >= -55 && lat <= 15 && lng >= -80 && lng <= -35) regions.push("SA");
  return regions.length > 0 ? regions : ["GLOBAL"];
}

// ── Convergence ID generator ───────────────────────────

let convergenceCounter = 0;

function generateId(): string {
  convergenceCounter++;
  const date = new Date().toISOString().slice(0, 10);
  return `conv-${date}-${String(convergenceCounter).padStart(3, "0")}`;
}

// ── Build Convergence from Correlation Group ───────────

function buildConvergence(
  group: CorrelationGroup,
  bayesianOptions: BayesianOptions = {}
): Omit<Convergence, "narrative"> {
  const categories = group.categories as Category[];
  const impactChain = resolveImpactChain(categories);
  const confidence = calculateConvergenceConfidence(
    group.events,
    impactChain,
    bayesianOptions
  );
  const roles = assignSignalRoles(group.events, impactChain);
  const type = classifyConvergence(categories);

  const signals: ConvergenceSignal[] = group.events.map((event) => ({
    sourceId: event.sourceId,
    eventId: event.eventId,
    category: event.category,
    severity: event.severity,
    reliability: event.reliability,
    role: roles.get(event.eventId) || "reaction",
    title: event.title,
    lat: event.lat,
    lng: event.lng,
    publishedAt: event.publishedAt,
  }));

  // Topic clusters don't have a real centroid, so inferRegions on
  // (0, 0) would incorrectly return ["AF"] (Gulf of Guinea bounding
  // box). Force ["GLOBAL"] for topic-only clusters.
  const regions = group.isTopic
    ? ["GLOBAL"]
    : inferRegions(group.centroid.lat, group.centroid.lng);

  // Phase 4: confidence-adaptive expiry instead of hardcoded 6h
  const ttl = ttlByConfidence(confidence);
  const expiresAt = new Date(Date.now() + ttl).toISOString();

  // Phase 3: forward predictions from the trigger event
  const trigger = pickTrigger(group.events);
  const rawPredictions = trigger ? predictFollowups(trigger, confidence) : [];
  const predictions: ConvergencePrediction[] = rawPredictions.map((p) => ({
    predictedCategory: p.predictedCategory,
    probability: p.probability,
    expectedWindowMs: p.expectedWindowMs,
    reasoning: p.reasoning,
    triggerEventId: p.triggerEventId,
    generatedAt: p.generatedAt,
    expiresAt: p.expiresAt,
    validated: false,
  }));

  return {
    id: generateId(),
    type,
    confidence,
    signals,
    impactChain,
    timeline: group.timeSpan,
    location: group.centroid,
    affectedRegions: regions,
    createdAt: new Date().toISOString(),
    expiresAt,
    predictions,
    isTopicCluster: group.isTopic === true,
  };
}

/** Pick the most likely trigger event from a cluster (earliest, highest severity tie-break) */
function pickTrigger(events: ClusterEvent[]): ClusterEvent | null {
  if (events.length === 0) return null;
  const sorted = [...events].sort((a, b) => {
    const dt = new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
    if (Math.abs(dt) > 15 * 60 * 1000) return dt;
    const sevOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
      info: 4,
    };
    return sevOrder[a.severity] - sevOrder[b.severity];
  });
  return sorted[0];
}

// ── Main Engine Functions ──────────────────────────────

/**
 * Full convergence scan — called by cron every 5 minutes.
 * Processes all recent events and generates convergences with narratives.
 *
 * @param items        raw intel events
 * @param hoursBack    lookback window (default: max category time window)
 * @param scanOptions  runtime-calibrated prior + per-cluster surprise lookup
 */
export async function runFullConvergenceScan(
  items: IntelItem[],
  hoursBack?: number,
  scanOptions: {
    priorOverride?: number;
    surpriseLookup?: (categories: Category[], lat: number, lng: number) => number;
  } = {}
): Promise<ConvergenceResponse> {
  // Reset counter per scan
  convergenceCounter = 0;

  // ── DUAL-TRACK CORRELATION (instrumented) ─────────────────
  // Each track returns both clusters AND a metrics snapshot. The
  // snapshots get collected into trackMetrics[] and returned in
  // the response so the cron route can persist them to the
  // convergence_metrics table for observability.
  //
  // Step 1a: Geographic track — Haversine clustering for events
  //          that have lat/lng (USGS, GDACS, local news, etc.)
  const geoResult = detectCorrelationsWithMetrics(items, hoursBack);

  // Step 1b: Topic track — semantic similarity clustering for
  //          geo-sparse events (Reddit, HN, YouTube, Bluesky,
  //          finance/tech news without location). This is where
  //          T4 social signals FINALLY reach the scorer, making
  //          the tier diversity bonus real.
  const topicResult = await detectTopicCorrelationsWithMetrics(items, hoursBack);

  const correlations: CorrelationGroup[] = [
    ...geoResult.correlations,
    ...topicResult.clusters,
  ];

  const trackMetrics: TrackMetrics[] = [geoResult.metrics, topicResult.metrics];

  if (correlations.length === 0) {
    return {
      convergences: [],
      metadata: {
        totalSignalsAnalyzed: items.length,
        convergencesFound: 0,
        timestamp: new Date().toISOString(),
      },
      trackMetrics,
    };
  }

  // Step 2: Semantic enrichment — embed all events in correlated groups.
  // Topic clusters already have embeddings from detectTopicCorrelations,
  // but running embedBatch again is idempotent thanks to the pgvector
  // cache (cache hit for everything that was just embedded).
  const enrichedCorrelations: CorrelationGroup[] = [];
  for (const c of correlations) {
    const embedded = await computeEventEmbeddings(c.events);
    // Phase 2: collapse near-duplicate headlines so they don't double-count
    const deduped = deduplicateBySemantics(embedded);
    enrichedCorrelations.push({ ...c, events: deduped });
  }

  // Step 3: Build convergence objects (without narrative)
  const rawConvergences = enrichedCorrelations.map((group) => {
    const surpriseMultiplier =
      scanOptions.surpriseLookup
        ? scanOptions.surpriseLookup(
            group.categories as Category[],
            group.centroid.lat,
            group.centroid.lng
          )
        : 1.0;
    return buildConvergence(group, {
      priorOverride: scanOptions.priorOverride,
      surpriseMultiplier,
    });
  });

  // Step 4: Filter to minimum confidence threshold
  const MIN_CONFIDENCE = 0.4;
  const filtered = rawConvergences.filter((c) => c.confidence >= MIN_CONFIDENCE);

  // Step 5: Generate LLM narratives for high-confidence convergences.
  // Wrapped in try/catch so any catastrophic narrative-layer failure
  // (provider outage, unexpected exception inside Promise.allSettled,
  // etc.) falls through to an empty narrative map — the cron still
  // gets its metrics row, its Redis write, and its history archive.
  // Narratives are a decoration, not load-bearing data.
  let narratives = new Map<string, string>();
  try {
    narratives = await batchGenerateNarratives(filtered, 0.7);
  } catch (err) {
    console.error(
      "[engine] batchGenerateNarratives threw unexpectedly — continuing without narratives:",
      err instanceof Error ? err.message : err
    );
  }

  // Step 6: Merge narratives. Predictions stay unvalidated (false) here —
  // validation happens in the cron route AFTER engine completes, against
  // the predictions store which holds the previous cycle's forecasts.
  // See predictions-store.ts:validateAndCleanup.
  const convergences: Convergence[] = filtered.map((c) => ({
    ...c,
    narrative: narratives.get(c.id),
  }));

  return {
    convergences: convergences.sort((a, b) => b.confidence - a.confidence),
    metadata: {
      totalSignalsAnalyzed: items.length,
      convergencesFound: convergences.length,
      timestamp: new Date().toISOString(),
    },
    trackMetrics,
  };
}

/**
 * Storyline integration helper. Given a fresh batch of convergences
 * and the currently-active storylines (from the DB), return:
 *
 *   - The updated/new storylines that should be persisted
 *   - The convergences with their `storylineId` field populated
 *
 * The cron route is responsible for calling this AFTER
 * runFullConvergenceScan and writing the result back to Supabase.
 *
 * Pure function — no DB access, easy to test.
 */
export function attachConvergencesToStorylines(
  convergences: Convergence[],
  activeStorylines: Storyline[]
): {
  convergences: Convergence[];
  storylinesToUpsert: Storyline[];
} {
  const storylinesById = new Map<string, Storyline>();
  for (const s of activeStorylines) storylinesById.set(s.id, s);

  const updated: Convergence[] = [];
  for (const conv of convergences) {
    const candidates = Array.from(storylinesById.values());
    const result = attachToStoryline(conv, candidates);
    if (result) {
      storylinesById.set(result.story.id, result.story);
      updated.push({ ...conv, storylineId: result.story.id });
    } else {
      const fresh = createStoryline(conv);
      storylinesById.set(fresh.id, fresh);
      updated.push({ ...conv, storylineId: fresh.id });
    }
  }

  return {
    convergences: updated,
    storylinesToUpsert: Array.from(storylinesById.values()),
  };
}

/**
 * Quick convergence check — called instantly when a critical/high event arrives.
 * Does NOT generate LLM narrative or run embeddings (too slow for instant path).
 */
export function runInstantCheck(
  newEvent: IntelItem,
  recentEvents: IntelItem[]
): Convergence | null {
  const correlation = checkEventCorrelation(newEvent, recentEvents);
  if (!correlation) return null;

  const raw = buildConvergence(correlation);

  // Only return if confidence is meaningful
  if (raw.confidence < 0.5) return null;

  return { ...raw, narrative: undefined } as Convergence;
}
