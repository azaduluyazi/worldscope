import { createServerClient } from "./supabase";
import type {
  TelemetryRecord,
  TelemetrySink,
  ConfidenceBucket,
} from "@/lib/convergence/telemetry";
import { computeBuckets } from "@/lib/convergence/telemetry";

// ═══════════════════════════════════════════════════════════════════
//  Telemetry sink (Supabase)
// ═══════════════════════════════════════════════════════════════════
//
//  Concrete TelemetrySink that writes records to the
//  convergence_telemetry table from migration 010.
//
//  Also exposes the calibration query: rolling 7-day CTR by
//  confidence bucket. This is the data the scorer is calibrated AGAINST.
//
// ═══════════════════════════════════════════════════════════════════

const TABLE = "convergence_telemetry";

function recordToRow(r: TelemetryRecord) {
  return {
    convergence_id: r.convergenceId,
    event: r.event,
    confidence: r.confidence,
    type: r.type,
    category_count: r.categoryCount,
    signal_count: r.signalCount,
    has_narrative: r.hasNarrative,
    predictions_validated: r.predictionsValidated,
    user_id: r.userId ?? null,
    surface: r.surface ?? null,
    created_at: r.timestamp,
  };
}

export class SupabaseTelemetrySink implements TelemetrySink {
  async record(event: TelemetryRecord): Promise<void> {
    try {
      const supabase = createServerClient();
      const { error } = await supabase.from(TABLE).insert(recordToRow(event));
      if (error) {
        console.error("[telemetry.record] error:", error);
      }
    } catch (err) {
      console.error("[telemetry.record] exception:", err);
    }
  }

  async recordBatch(events: TelemetryRecord[]): Promise<void> {
    if (events.length === 0) return;
    try {
      const supabase = createServerClient();
      const { error } = await supabase.from(TABLE).insert(events.map(recordToRow));
      if (error) {
        console.error("[telemetry.recordBatch] error:", error);
      }
    } catch (err) {
      console.error("[telemetry.recordBatch] exception:", err);
    }
  }
}

let _sink: SupabaseTelemetrySink | null = null;
export function getTelemetrySink(): SupabaseTelemetrySink {
  if (!_sink) _sink = new SupabaseTelemetrySink();
  return _sink;
}

// ── Calibration query ──────────────────────────────────────────────

/**
 * Read the rolling-7-day CTR view to get the calibration curve.
 * Returns ConfidenceBucket[] in the same shape the convergence
 * telemetry module already exposes.
 */
export async function fetchCtrBuckets(): Promise<ConfidenceBucket[]> {
  try {
    const supabase = createServerClient();
    // Read raw events for the last 7 days and bucket in JS so we share
    // the bucketing math with the in-memory implementation.
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from(TABLE)
      .select("convergence_id, event, confidence, type, category_count, signal_count, has_narrative, predictions_validated, user_id, surface, created_at")
      .gte("created_at", since)
      .limit(50_000);
    if (error || !data) return [];
    const records: TelemetryRecord[] = data.map((r) => ({
      convergenceId: r.convergence_id,
      event: r.event,
      confidence: Number(r.confidence),
      type: r.type,
      categoryCount: r.category_count,
      signalCount: r.signal_count,
      hasNarrative: r.has_narrative,
      predictionsValidated: r.predictions_validated,
      userId: r.user_id ?? undefined,
      surface: r.surface ?? undefined,
      timestamp: r.created_at,
    }));
    return computeBuckets(records);
  } catch (err) {
    console.error("[telemetry.fetchCtrBuckets] exception:", err);
    return [];
  }
}
