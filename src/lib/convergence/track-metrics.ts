// ═══════════════════════════════════════════════════════════════════
//  Track Metrics — observability for convergence detector tracks
// ═══════════════════════════════════════════════════════════════════
//
//  Every cron cycle writes one row per track (geo + topic) to the
//  convergence_metrics table (migration 014). This module defines
//  the shape and the failure-reason taxonomy.
//
//  The point: when something goes wrong, you should be able to
//  answer "why did we produce 0 clusters?" with a single SQL query,
//  not by reading code.
//
//  Failure taxonomy (kept coarse — detail goes into counter fields):
//    - no_input        → zero eligible events reached the detector
//    - embedding_down  → events present, but ≥50% failed to embed
//    - no_pairs        → events embedded, but zero satisfied the
//                        (similarity + time + category) predicate
//    - filtered_out    → pairs found, but all clusters failed the
//                        min-size or min-category filter
//    - unexpected      → threw an exception (caller catches it)
//
// ═══════════════════════════════════════════════════════════════════

export type ConvergenceTrack = "geo" | "topic";

export type FailureReason =
  | "no_input"
  | "embedding_down"
  | "no_pairs"
  | "filtered_out"
  | "unexpected";

/**
 * Base counters shared by both tracks.
 */
interface BaseTrackMetrics {
  track: ConvergenceTrack;
  cycleTimestamp: string;
  eventsInput: number;
  clustersProduced: number;
  durationMs: number;
  /** NULL when clustersProduced > 0 */
  failureReason: FailureReason | null;
}

/**
 * Topic-track-specific counters. The extra fields isolate WHICH stage
 * ate the input: embedding, pairing, or filtering.
 */
export interface TopicTrackMetrics extends BaseTrackMetrics {
  track: "topic";
  eventsWithEmbedding: number;
  eventsSkippedNoEmbedding: number;
  clustersDroppedMinSize: number;
  clustersDroppedSingleCategory: number;
}

/**
 * Geo-track-specific counters. The geo track has a different pipeline
 * (Haversine → temporal groups → cluster), so its counters track
 * those stages instead of embedding stages.
 */
export interface GeoTrackMetrics extends BaseTrackMetrics {
  track: "geo";
  geoClustersFound: number;
  temporalGroupsFound: number;
}

export type TrackMetrics = TopicTrackMetrics | GeoTrackMetrics;

/**
 * Infer the failure reason from a topic-track counter snapshot.
 * Called once at the end of a detection run when clustersProduced = 0.
 */
export function classifyTopicFailure(m: {
  eventsInput: number;
  eventsWithEmbedding: number;
  clustersDroppedMinSize: number;
  clustersDroppedSingleCategory: number;
}): FailureReason {
  if (m.eventsInput === 0) return "no_input";
  // Embedding pipeline down: >50% of events failed to embed.
  if (m.eventsWithEmbedding < Math.ceil(m.eventsInput / 2)) {
    return "embedding_down";
  }
  // Everything was filtered by size/category rules.
  if (m.clustersDroppedMinSize > 0 || m.clustersDroppedSingleCategory > 0) {
    return "filtered_out";
  }
  // Embeddings present but no pair exceeded the similarity threshold.
  return "no_pairs";
}

/**
 * Infer the failure reason from a geo-track counter snapshot.
 */
export function classifyGeoFailure(m: {
  eventsInput: number;
  geoClustersFound: number;
  temporalGroupsFound: number;
}): FailureReason {
  if (m.eventsInput === 0) return "no_input";
  if (m.geoClustersFound === 0) return "no_pairs";
  if (m.temporalGroupsFound === 0) return "filtered_out";
  return "filtered_out";
}

/**
 * Factory for a fresh topic metrics object, filled with zeros.
 * Detectors mutate fields as they run, then return the final object.
 */
export function emptyTopicMetrics(): TopicTrackMetrics {
  return {
    track: "topic",
    cycleTimestamp: new Date().toISOString(),
    eventsInput: 0,
    eventsWithEmbedding: 0,
    eventsSkippedNoEmbedding: 0,
    clustersProduced: 0,
    clustersDroppedMinSize: 0,
    clustersDroppedSingleCategory: 0,
    durationMs: 0,
    failureReason: null,
  };
}

export function emptyGeoMetrics(): GeoTrackMetrics {
  return {
    track: "geo",
    cycleTimestamp: new Date().toISOString(),
    eventsInput: 0,
    geoClustersFound: 0,
    temporalGroupsFound: 0,
    clustersProduced: 0,
    durationMs: 0,
    failureReason: null,
  };
}
