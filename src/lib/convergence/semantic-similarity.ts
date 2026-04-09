import type { ClusterEvent } from "./types";
import { getEmbeddingProvider, cosineSimilarity } from "./embedding";
import {
  fetchExistingEmbeddings,
  storeEmbeddings,
} from "@/lib/db/convergence-embeddings";

// ═══════════════════════════════════════════════════════════════════
//  Semantic Similarity Layer
// ═══════════════════════════════════════════════════════════════════
//
//  PURPOSE:
//  --------
//  The geo+time correlation detector misses events that are about the
//  same topic but separated by distance. Example:
//
//    "Erdoğan addresses parliament about inflation" (Ankara)
//    "Markets react to Erdoğan's parliament speech"  (Istanbul, 450km)
//
//  These two are clearly the same story, but the protest/finance
//  geo radius (25km / 500km) wouldn't pair them — and even if they did
//  geographically, the categories alone don't tell us the speech and
//  the reaction are linked.
//
//  This module provides:
//   1. computeEventEmbeddings: enrich a list of ClusterEvents with vectors
//   2. semanticDuplicates: find near-duplicate events (similarity > 0.92)
//   3. semanticBridges: find pairs that geo-time missed but content links
//
//  These functions are CALLED FROM the engine BEFORE the bayesian
//  scorer runs, so the cluster reflects semantic reality not just
//  geographic proximity.
//
// ═══════════════════════════════════════════════════════════════════

const NEAR_DUPLICATE_THRESHOLD = 0.92;
const SEMANTIC_LINK_THRESHOLD = 0.78;

/**
 * Cap on the number of cache-miss embeddings we request per call.
 *
 * WHY: Google downgraded the free-tier quota when migrating from
 * text-embedding-004 to gemini-embedding-001. The new cap observed in
 * production (via convergence_metrics.debug_hint) is
 * `embed_content_free_tier_requests, limit: 100` with a ~30-second
 * retry window — i.e. ~100 text embeddings per minute per project.
 *
 * A 5-minute cron cycle can therefore afford at most ~500 new
 * embeddings. We cap at 300 to leave headroom for other callers on
 * the same API key (semantic dedup inside enriched correlations,
 * storyline matching, etc.) and for Google's rate-limiter being
 * slightly less generous than the stated number.
 *
 * The pgvector cache means already-embedded events cost zero quota
 * on subsequent cycles. Over ~4-5 cycles the rolling 48h non-geo
 * event window fills up and steady state only costs ~20-40 new
 * embeddings per cycle.
 */
const MAX_CACHE_MISSES_PER_CALL = 300;

/** Enriched event with optional embedding vector */
export interface EmbeddedEvent extends ClusterEvent {
  embedding?: number[];
}

/**
 * Embed a batch of events using their titles. Returns the events
 * enriched with `embedding` fields.
 *
 * v3.1 optimization — now uses the pgvector cache:
 *   1. Look up existing embeddings for these event IDs
 *   2. Only call the embedding provider for cache misses
 *   3. Write the new embeddings back to the cache
 *
 * This cuts the per-cycle Gemini API cost to roughly the number of
 * NEW events (~30-50/cycle) instead of the full correlation batch
 * (~300+ events). Quota usage drops ~85%.
 *
 * Errors are swallowed so a partial outage doesn't kill the pipeline.
 */
export async function computeEventEmbeddings<T extends ClusterEvent>(
  events: T[],
  options: {
    /**
     * Callback invoked with the error message string if embedding
     * fails. Lets the caller surface the real provider error into
     * higher-level observability (e.g., the topic metrics row's
     * debug_hint column). Still graceful-degrade — callback is
     * advisory, not a rethrow.
     */
    onEmbeddingError?: (message: string) => void;
  } = {}
): Promise<(T & { embedding?: number[] })[]> {
  if (events.length === 0) return events as (T & { embedding?: number[] })[];

  // Step 1: check the pgvector cache
  const eventIds = events.map((e) => e.eventId);
  let cached = new Map<string, number[]>();
  try {
    cached = await fetchExistingEmbeddings(eventIds);
  } catch (err) {
    console.error("[semantic-similarity] cache lookup failed:", err);
  }

  // Step 2: find missing events, then cap by the per-call quota budget.
  // Events beyond the cap are left without embeddings THIS cycle and
  // will be picked up on subsequent cycles — the pgvector cache makes
  // this a one-time cost per event.
  const allMissing = events.filter((e) => !cached.has(e.eventId));
  const missing = allMissing.slice(0, MAX_CACHE_MISSES_PER_CALL);
  const throttledCount = allMissing.length - missing.length;

  let newEmbeddings: number[][] = [];
  if (missing.length > 0) {
    try {
      const provider = getEmbeddingProvider();
      const titles = missing.map((e) => e.title);
      newEmbeddings = await provider.embedBatch(titles);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[semantic-similarity] embedding batch failed:", msg);
      options.onEmbeddingError?.(msg);
      // Graceful degrade — events without embeddings skip downstream checks
    }
  }

  // Surface the throttle decision through the same callback the
  // detector uses for real errors, so operators see WHY N events
  // don't have embeddings even though the provider is healthy.
  if (throttledCount > 0 && newEmbeddings.length === missing.length) {
    options.onEmbeddingError?.(
      `throttled: embedded ${missing.length}/${allMissing.length} ` +
        `cache misses this cycle; ${throttledCount} deferred to next ` +
        `cycle (free-tier ~100 req/min quota)`
    );
  }

  // Step 3: write new embeddings to the cache (fire-and-forget)
  if (newEmbeddings.length === missing.length && newEmbeddings.length > 0) {
    storeEmbeddings(
      missing.map((e, i) => ({ eventId: e.eventId, embedding: newEmbeddings[i] }))
    ).catch((err) => console.error("[semantic-similarity] cache write failed:", err));
  }

  // Step 4: merge cached + new into a single eventId→vector map
  const byEventId = new Map<string, number[]>(cached);
  for (let i = 0; i < missing.length; i++) {
    const vec = newEmbeddings[i];
    if (vec) byEventId.set(missing[i].eventId, vec);
  }

  return events.map((e) => ({
    ...e,
    embedding: byEventId.get(e.eventId),
  })) as (T & { embedding?: number[] })[];
}

/**
 * Find near-duplicate events within a set. Useful BEFORE Bayesian
 * scoring: collapse near-dupes into a single representative event so
 * we don't double-count the same story phrased differently.
 *
 * Returns a Map<eventId, eventId[]> where the key is the
 * "representative" (oldest, highest reliability) and the values are
 * its duplicates.
 */
export function findNearDuplicates(
  events: EmbeddedEvent[],
  threshold: number = NEAR_DUPLICATE_THRESHOLD
): Map<string, string[]> {
  const dupes = new Map<string, string[]>();
  const claimed = new Set<string>();

  for (let i = 0; i < events.length; i++) {
    const a = events[i];
    if (!a.embedding || claimed.has(a.eventId)) continue;
    const cluster: string[] = [];
    for (let j = i + 1; j < events.length; j++) {
      const b = events[j];
      if (!b.embedding || claimed.has(b.eventId)) continue;
      const sim = cosineSimilarity(a.embedding, b.embedding);
      if (sim >= threshold) {
        cluster.push(b.eventId);
        claimed.add(b.eventId);
      }
    }
    if (cluster.length > 0) {
      dupes.set(a.eventId, cluster);
    }
  }

  return dupes;
}

/**
 * After near-dedup, return a filtered event list keeping only the
 * representatives. Used before passing to scorer so confidence isn't
 * inflated by paraphrased copies of the same headline.
 */
export function deduplicateBySemantics(
  events: EmbeddedEvent[],
  threshold: number = NEAR_DUPLICATE_THRESHOLD
): EmbeddedEvent[] {
  if (events.length < 2) return events;
  const dupes = findNearDuplicates(events, threshold);
  const removeIds = new Set<string>();
  for (const ids of dupes.values()) {
    for (const id of ids) removeIds.add(id);
  }
  return events.filter((e) => !removeIds.has(e.eventId));
}

/**
 * Find "semantic bridges" — pairs of events whose embedding similarity
 * is high enough to suggest they're about the same story, but which
 * the geo+time detector did NOT cluster together.
 *
 * Used to merge correlation groups that should have been one cluster.
 *
 * Returns a list of (eventId, eventId, similarity) tuples.
 */
export function findSemanticBridges(
  events: EmbeddedEvent[],
  threshold: number = SEMANTIC_LINK_THRESHOLD
): Array<{ a: string; b: string; similarity: number }> {
  const bridges: Array<{ a: string; b: string; similarity: number }> = [];
  for (let i = 0; i < events.length; i++) {
    const a = events[i];
    if (!a.embedding) continue;
    for (let j = i + 1; j < events.length; j++) {
      const b = events[j];
      if (!b.embedding) continue;
      const sim = cosineSimilarity(a.embedding, b.embedding);
      if (sim >= threshold) {
        bridges.push({ a: a.eventId, b: b.eventId, similarity: sim });
      }
    }
  }
  // Strongest bridges first
  return bridges.sort((x, y) => y.similarity - x.similarity);
}
