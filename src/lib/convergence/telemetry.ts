import type { Convergence } from "./types";

// ═══════════════════════════════════════════════════════════════════
//  Telemetry — The Feedback Loop That Makes Everything Else Worth It
// ═══════════════════════════════════════════════════════════════════
//
//  WHY this matters more than the math:
//  ------------------------------------
//  Every other module in this folder makes assumptions: half-life
//  values, dampening factors, the Bayesian prior, the geo radii.
//  Right now those numbers are reasoned guesses. After this telemetry
//  layer ships, those numbers can be CALIBRATED against real user
//  behavior.
//
//  The KPI: Click-Through Rate by confidence bucket.
//
//    confidence 0.40-0.50 → 4% CTR  (boring, threshold too low)
//    confidence 0.50-0.60 → 8% CTR
//    confidence 0.60-0.70 → 14% CTR
//    confidence 0.70-0.80 → 22% CTR
//    confidence 0.80-0.90 → 31% CTR
//    confidence 0.90-1.00 → 44% CTR
//
//  If the curve is monotonic and steep → the scorer is well-calibrated.
//  If a high-confidence bucket has LOW CTR → there's a bug or a wrong
//  weight, debug-able by drilling into Bayesian breakdown of those
//  specific convergences.
//
//  This is the moat: every WorldScope user click trains the engine.
//  WorldMonitor doesn't have this data and can't get it from us.
//
//  STORAGE: Supabase table `convergence_telemetry` (created in
//  Phase 7 / migration). This module exposes the API surface; the
//  actual writer is injected.
//
// ═══════════════════════════════════════════════════════════════════

export type TelemetryEvent =
  | "shown"        // surfaced in UI / briefing email
  | "clicked"      // user opened the convergence detail
  | "dismissed"    // user hid it
  | "expanded"     // user opened the impact chain
  | "shared"       // user shared the link
  | "feedback_pos" // user thumbs-up
  | "feedback_neg"; // user thumbs-down

export interface TelemetryRecord {
  convergenceId: string;
  event: TelemetryEvent;
  confidence: number;
  type: string;
  categoryCount: number;
  signalCount: number;
  hasNarrative: boolean;
  predictionsValidated: number;
  userId?: string;
  timestamp: string;
  /** Surface where the event happened (panel, email, mobile, etc.) */
  surface?: string;
}

export interface TelemetrySink {
  record(event: TelemetryRecord): Promise<void>;
  recordBatch(events: TelemetryRecord[]): Promise<void>;
}

// ── Aggregation: bucket-level metrics ─────────────────────────────

export interface ConfidenceBucket {
  min: number;
  max: number;
  shown: number;
  clicked: number;
  ctr: number;
}

export const DEFAULT_BUCKETS: Array<{ min: number; max: number }> = [
  { min: 0.4, max: 0.5 },
  { min: 0.5, max: 0.6 },
  { min: 0.6, max: 0.7 },
  { min: 0.7, max: 0.8 },
  { min: 0.8, max: 0.9 },
  { min: 0.9, max: 1.01 },
];

/**
 * Compute click-through rate by confidence bucket from raw records.
 * The output is the calibration curve we use to tune the scorer.
 */
export function computeBuckets(records: TelemetryRecord[]): ConfidenceBucket[] {
  return DEFAULT_BUCKETS.map((b) => {
    const inBucket = records.filter(
      (r) => r.confidence >= b.min && r.confidence < b.max
    );
    const shown = inBucket.filter((r) => r.event === "shown").length;
    const clicked = inBucket.filter((r) => r.event === "clicked").length;
    return {
      min: b.min,
      max: b.max,
      shown,
      clicked,
      ctr: shown > 0 ? clicked / shown : 0,
    };
  });
}

/**
 * Detect calibration anomalies: buckets where higher confidence has
 * LOWER CTR than the bucket below it. These are bugs to investigate.
 */
export function findCalibrationAnomalies(
  buckets: ConfidenceBucket[]
): Array<{ lowBucket: ConfidenceBucket; highBucket: ConfidenceBucket; gap: number }> {
  const anomalies: Array<{
    lowBucket: ConfidenceBucket;
    highBucket: ConfidenceBucket;
    gap: number;
  }> = [];
  for (let i = 1; i < buckets.length; i++) {
    const low = buckets[i - 1];
    const high = buckets[i];
    if (low.shown < 30 || high.shown < 30) continue; // not enough data
    if (high.ctr < low.ctr) {
      anomalies.push({ lowBucket: low, highBucket: high, gap: low.ctr - high.ctr });
    }
  }
  return anomalies;
}

// ── Convenience: build a record from a Convergence ───────────────

export function buildShownRecord(
  conv: Convergence,
  surface: string,
  userId?: string
): TelemetryRecord {
  return {
    convergenceId: conv.id,
    event: "shown",
    confidence: conv.confidence,
    type: conv.type,
    categoryCount: new Set(conv.signals.map((s) => s.category)).size,
    signalCount: conv.signals.length,
    hasNarrative: !!conv.narrative,
    predictionsValidated: 0, // populated post-validation
    userId,
    timestamp: new Date().toISOString(),
    surface,
  };
}
