import { redis } from "@/lib/cache/redis";
import type { ConfidenceBucket } from "./telemetry";
import { findCalibrationAnomalies } from "./telemetry";

// ═══════════════════════════════════════════════════════════════════
//  Auto-Calibration — Telemetry → Bayesian Prior Tuning
// ═══════════════════════════════════════════════════════════════════
//
//  THE POINT:
//  ----------
//  The Bayesian scorer has a PRIOR belief (default 0.30) that any
//  random multi-signal cluster is a "real" convergence. This prior
//  is the biggest single lever in the whole scoring system.
//
//  How do we know it's right? We don't. We GUESSED 0.30 and said
//  "we'll calibrate later when telemetry arrives". This module is
//  that calibration.
//
//  THE METHOD:
//  -----------
//  Telemetry gives us CTR-by-confidence-bucket (how often users
//  click a convergence of each confidence level). A well-calibrated
//  scorer produces a MONOTONIC curve: higher confidence → higher CTR.
//
//  If the curve is inverted (high-conf has LOWER CTR than mid-conf),
//  the prior is too aggressive — the scorer is over-confident.
//  Lower the prior. Conversely, if the curve is too flat, the prior
//  is too conservative.
//
//  ALGORITHM:
//  ----------
//  1. Fetch current CTR buckets from telemetry.
//  2. Compute the "target CTR" — what we want each bucket to be.
//     A well-calibrated scorer roughly satisfies bucket_ctr ≈ bucket_mid
//     (i.e. a 0.7-0.8 bucket should get ~75% CTR).
//  3. Compute the average error between observed and target.
//  4. Adjust the prior up or down proportionally, with a damping
//     factor to avoid oscillation.
//  5. Write the new prior to Redis. The scorer reads it on startup
//     (or per-call for always-fresh).
//
//  STORAGE:
//  --------
//    calibration:prior → numeric value (0.05 - 0.70 clamped)
//    calibration:history → rolling log of past adjustments for audit
//
// ═══════════════════════════════════════════════════════════════════

const CALIBRATED_PRIOR_KEY = "calibration:prior";
const CALIBRATION_HISTORY_KEY = "calibration:history";
const CALIBRATION_HISTORY_MAX = 50;

const DEFAULT_PRIOR = 0.30;
const MIN_PRIOR = 0.05;
const MAX_PRIOR = 0.70;
const DAMPING = 0.3; // how aggressively we move toward the target
const MIN_SAMPLES_PER_BUCKET = 30;

export interface CalibrationRecord {
  timestamp: string;
  oldPrior: number;
  newPrior: number;
  sampleSize: number;
  avgError: number;
  anomaliesDetected: number;
  reason: string;
}

/**
 * Compute the "target CTR" for a bucket — the CTR a well-calibrated
 * scorer SHOULD produce for that confidence range.
 *
 * We use the midpoint of the bucket as the target:
 *   bucket [0.7, 0.8) → target CTR = 0.75
 *
 * This assumes users click in proportion to true probability, which
 * is the Brier-optimal calibration target. Won't be perfect in
 * practice (users also click on attention-grabbing headlines) but
 * it's a reasonable north star.
 */
function targetCtrForBucket(bucket: ConfidenceBucket): number {
  return (bucket.min + Math.min(bucket.max, 1.0)) / 2;
}

/**
 * Analyze the current calibration curve and compute the optimal
 * prior adjustment. Returns null if there isn't enough data.
 */
export function computePriorAdjustment(
  buckets: ConfidenceBucket[],
  currentPrior: number = DEFAULT_PRIOR
): {
  newPrior: number;
  avgError: number;
  sampleSize: number;
  reason: string;
} | null {
  const informative = buckets.filter((b) => b.shown >= MIN_SAMPLES_PER_BUCKET);
  if (informative.length < 2) {
    return null; // not enough data
  }

  // Compute signed error: positive means CTR is HIGHER than target
  // (scorer is under-confident, should raise prior).
  // Negative means CTR is LOWER than target (scorer is over-confident,
  // should lower prior).
  let sumError = 0;
  let totalSamples = 0;
  for (const b of informative) {
    const target = targetCtrForBucket(b);
    const error = b.ctr - target;
    sumError += error * b.shown;
    totalSamples += b.shown;
  }
  const avgError = sumError / totalSamples;

  // Move the prior toward the implied direction, damped to avoid
  // oscillation. A full-swing adjustment of ±0.15 per cycle is the cap.
  const rawAdjustment = avgError * DAMPING;
  const clampedAdjustment = Math.max(-0.15, Math.min(0.15, rawAdjustment));
  const newPrior = Math.max(
    MIN_PRIOR,
    Math.min(MAX_PRIOR, currentPrior + clampedAdjustment)
  );

  let reason: string;
  if (avgError > 0.05) {
    reason = "CTR higher than target → scorer under-confident, raising prior";
  } else if (avgError < -0.05) {
    reason = "CTR lower than target → scorer over-confident, lowering prior";
  } else {
    reason = "Calibration within tolerance, minor adjustment";
  }

  return { newPrior, avgError, sampleSize: totalSamples, reason };
}

/**
 * Run one calibration cycle: read buckets, compute adjustment, write
 * the new prior to Redis. Returns the calibration record for logging.
 */
export async function runCalibrationCycle(
  buckets: ConfidenceBucket[]
): Promise<CalibrationRecord | null> {
  const currentPrior = await getCalibratedPrior();
  const adjustment = computePriorAdjustment(buckets, currentPrior);
  if (!adjustment) return null;

  const anomalies = findCalibrationAnomalies(buckets);
  const record: CalibrationRecord = {
    timestamp: new Date().toISOString(),
    oldPrior: currentPrior,
    newPrior: adjustment.newPrior,
    sampleSize: adjustment.sampleSize,
    avgError: adjustment.avgError,
    anomaliesDetected: anomalies.length,
    reason: adjustment.reason,
  };

  // Only write if the change is meaningful (>1%)
  if (Math.abs(adjustment.newPrior - currentPrior) >= 0.01) {
    try {
      await redis.set(CALIBRATED_PRIOR_KEY, adjustment.newPrior);
      const history =
        (await redis.get<CalibrationRecord[]>(CALIBRATION_HISTORY_KEY)) ?? [];
      const merged = [record, ...history].slice(0, CALIBRATION_HISTORY_MAX);
      await redis.set(CALIBRATION_HISTORY_KEY, merged);
    } catch (err) {
      console.error("[calibration] write failed:", err);
    }
  }

  return record;
}

/**
 * Read the currently-calibrated prior from Redis, or fall back to
 * the default if calibration hasn't run yet. This is the function
 * the engine calls on every scan.
 */
export async function getCalibratedPrior(): Promise<number> {
  try {
    const stored = await redis.get<number>(CALIBRATED_PRIOR_KEY);
    if (typeof stored === "number" && stored >= MIN_PRIOR && stored <= MAX_PRIOR) {
      return stored;
    }
  } catch (err) {
    console.error("[calibration.getCalibratedPrior] error:", err);
  }
  return DEFAULT_PRIOR;
}

/**
 * Fetch the rolling calibration history for the admin dashboard.
 */
export async function fetchCalibrationHistory(): Promise<CalibrationRecord[]> {
  try {
    return (await redis.get<CalibrationRecord[]>(CALIBRATION_HISTORY_KEY)) ?? [];
  } catch {
    return [];
  }
}
