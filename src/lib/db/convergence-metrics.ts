import { createServerClient } from "./supabase";
import type { TrackMetrics } from "@/lib/convergence/track-metrics";

// ═══════════════════════════════════════════════════════════════════
//  Convergence Metrics Repository
// ═══════════════════════════════════════════════════════════════════
//
//  Writes per-cycle counter snapshots from the geo + topic tracks
//  into the convergence_metrics table (migration 014). Reads are used
//  by the admin dashboard and by ops diagnostics.
//
//  Fail-open semantics: if the DB write fails for any reason, we log
//  and continue — observability must NEVER break the actual cron run.
// ═══════════════════════════════════════════════════════════════════

const TABLE = "convergence_metrics";

/**
 * Persist a single track metrics snapshot. Safe to call from hot
 * paths — swallows errors so the detector pipeline keeps running
 * even if Supabase is having a bad day.
 */
export async function recordTrackMetrics(metrics: TrackMetrics): Promise<void> {
  try {
    const supabase = createServerClient();
    const row = toRow(metrics);
    const { error } = await supabase.from(TABLE).insert(row);
    if (error) {
      console.error("[convergence-metrics.record] error:", error.message);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[convergence-metrics.record] exception:", msg);
  }
}

/**
 * Persist BOTH tracks in one round trip. Preferred when the cron has
 * both metrics ready — one INSERT is cheaper than two.
 */
export async function recordBothTrackMetrics(
  metrics: TrackMetrics[]
): Promise<void> {
  if (metrics.length === 0) return;
  try {
    const supabase = createServerClient();
    const rows = metrics.map(toRow);
    const { error } = await supabase.from(TABLE).insert(rows);
    if (error) {
      console.error("[convergence-metrics.recordBoth] error:", error.message);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[convergence-metrics.recordBoth] exception:", msg);
  }
}

/**
 * Fetch the 7-day health summary (reads the convergence_track_health
 * view created in migration 014). Used by the admin observability
 * panel to show "geo: 288 cycles, 21 clusters; topic: 288 cycles,
 * 0 clusters, top_failure = embedding_down".
 */
export async function fetchTrackHealthSummary(): Promise<
  Array<{
    track: "geo" | "topic";
    cycles: number;
    total_events_seen: number;
    total_clusters: number;
    avg_clusters_per_cycle: number;
    empty_cycles: number;
    failure_cycles: number;
    avg_duration_ms: number;
    top_failure_reason: string | null;
  }>
> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("convergence_track_health")
      .select("*");
    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error("[convergence-metrics.fetchHealth] exception:", err);
    return [];
  }
}

/**
 * Map a discriminated-union TrackMetrics into a flat DB row.
 * The non-applicable columns go in as NULL.
 */
function toRow(m: TrackMetrics): Record<string, unknown> {
  const base = {
    cycle_timestamp: m.cycleTimestamp,
    track: m.track,
    events_input: m.eventsInput,
    clusters_produced: m.clustersProduced,
    duration_ms: m.durationMs,
    failure_reason: m.failureReason,
  };
  if (m.track === "topic") {
    return {
      ...base,
      events_with_embedding: m.eventsWithEmbedding,
      events_skipped_no_embedding: m.eventsSkippedNoEmbedding,
      clusters_dropped_min_size: m.clustersDroppedMinSize,
      clusters_dropped_single_category: m.clustersDroppedSingleCategory,
      geo_clusters_found: null,
      temporal_groups_found: null,
    };
  }
  // geo
  return {
    ...base,
    events_with_embedding: null,
    events_skipped_no_embedding: null,
    clusters_dropped_min_size: null,
    clusters_dropped_single_category: null,
    geo_clusters_found: m.geoClustersFound,
    temporal_groups_found: m.temporalGroupsFound,
  };
}
