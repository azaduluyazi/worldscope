import { createServerClient } from "./supabase";
import type { Convergence } from "@/lib/convergence/types";

// ═══════════════════════════════════════════════════════════════════
//  Convergence History Repository
// ═══════════════════════════════════════════════════════════════════
//
//  Persistent archive of every convergence the engine produces. This
//  is the data backbone for:
//    - Backtesting against real historical data (not just synthetic)
//    - Telemetry-to-confidence calibration
//    - Retroactive storyline drilldown
//    - Prediction validation audit trail
//
//  Table defined in migration 011.
//
// ═══════════════════════════════════════════════════════════════════

const TABLE = "convergence_history";

interface HistoryRow {
  id: string;
  type: string;
  confidence: number;
  signals: Convergence["signals"];
  impact_chain: Convergence["impactChain"];
  predictions: Convergence["predictions"];
  narrative: string | null;
  timeline_start: string;
  timeline_end: string;
  centroid_lat: number;
  centroid_lng: number;
  affected_regions: string[];
  categories: string[];
  signal_count: number;
  category_count: number;
  storyline_id: string | null;
  created_at: string;
  cycle_timestamp: string;
}

function toRow(conv: Convergence, cycleTimestamp: string): HistoryRow {
  const categories = Array.from(new Set(conv.signals.map((s) => s.category)));
  return {
    id: conv.id,
    type: conv.type,
    confidence: conv.confidence,
    signals: conv.signals,
    impact_chain: conv.impactChain,
    predictions: conv.predictions ?? [],
    narrative: conv.narrative ?? null,
    timeline_start: conv.timeline.start,
    timeline_end: conv.timeline.end,
    centroid_lat: conv.location.lat,
    centroid_lng: conv.location.lng,
    affected_regions: conv.affectedRegions,
    categories,
    signal_count: conv.signals.length,
    category_count: categories.length,
    storyline_id: conv.storylineId ?? null,
    created_at: conv.createdAt,
    cycle_timestamp: cycleTimestamp,
  };
}

/**
 * Write convergences to the permanent archive. Called from the cron
 * route after every full scan.
 *
 * Uses upsert on id so re-running the cron in the same minute doesn't
 * create duplicates. The id generator in engine.ts is deterministic
 * within a cycle.
 */
export async function persistConvergences(convergences: Convergence[]): Promise<number> {
  if (convergences.length === 0) return 0;
  try {
    const supabase = createServerClient();
    const cycleTs = new Date().toISOString();
    const rows = convergences.map((c) => toRow(c, cycleTs));
    const { error, count } = await supabase
      .from(TABLE)
      .upsert(rows, { onConflict: "id", count: "exact" });
    if (error) {
      console.error("[convergence-history.persist] error:", error);
      return 0;
    }
    return count ?? rows.length;
  } catch (err) {
    console.error("[convergence-history.persist] exception:", err);
    return 0;
  }
}

/**
 * Fetch recent convergences for backtesting / calibration / drilldown.
 * Default: last 7 days, highest confidence first.
 */
export async function fetchRecentHistory(options: {
  daysBack?: number;
  minConfidence?: number;
  limit?: number;
  category?: string;
  region?: string;
} = {}): Promise<Convergence[]> {
  const {
    daysBack = 7,
    minConfidence = 0.4,
    limit = 500,
    category,
    region,
  } = options;
  try {
    const supabase = createServerClient();
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
    let query = supabase
      .from(TABLE)
      .select("*")
      .gte("created_at", since)
      .gte("confidence", minConfidence)
      .order("confidence", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    if (category) query = query.contains("categories", [category]);
    if (region) query = query.contains("affected_regions", [region]);
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((row: HistoryRow) => ({
      id: row.id,
      type: row.type as Convergence["type"],
      confidence: Number(row.confidence),
      signals: row.signals,
      impactChain: row.impact_chain,
      narrative: row.narrative ?? undefined,
      timeline: { start: row.timeline_start, end: row.timeline_end },
      location: { lat: Number(row.centroid_lat), lng: Number(row.centroid_lng) },
      affectedRegions: row.affected_regions,
      createdAt: row.created_at,
      expiresAt: row.created_at, // legacy — not used for history reads
      predictions: row.predictions,
      storylineId: row.storyline_id ?? undefined,
    }));
  } catch (err) {
    console.error("[convergence-history.fetchRecent] exception:", err);
    return [];
  }
}

/**
 * Call the RPC function to delete convergence_history rows older than
 * 90 days. Returns the count of purged rows.
 */
export async function purgeOldHistory(): Promise<number> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.rpc("purge_old_convergence_history");
    if (error) {
      console.error("[convergence-history.purge] error:", error);
      return 0;
    }
    return Number(data ?? 0);
  } catch (err) {
    console.error("[convergence-history.purge] exception:", err);
    return 0;
  }
}
