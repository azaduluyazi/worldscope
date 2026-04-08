import type { Category } from "@/types/intel";
import type { ClusterEvent } from "./types";
import { CATEGORY_TIME_WINDOWS } from "./time-windows";

// ═══════════════════════════════════════════════════════════════════
//  Forward Prediction Engine
// ═══════════════════════════════════════════════════════════════════
//
//  THE PRODUCT INSIGHT:
//  --------------------
//  The current convergence engine is RETROSPECTIVE: it tells you
//  "these signals just clustered together". The really valuable thing
//  is PROSPECTIVE: "given this signal, here's what to expect next".
//
//  The impact-chain rules in impact-chain.ts already encode causality:
//
//      conflict → energy   (0.85)
//      conflict → finance  (0.80)
//      conflict → diplomacy (0.85)
//      ...
//
//  Run those rules FORWARD instead of backward:
//
//      A high-confidence "conflict" signal lands in WorldScope.
//      ⇒ Predict: energy signal expected within 3h (85% probability)
//                 finance signal expected within 30min (80%)
//                 diplomacy signal expected within 24h (85%)
//
//  Then when one of those predicted signals actually arrives,
//  it counts as a VALIDATED PREDICTION → the convergence carries an
//  extra-trust badge: "we said this would happen, and it did".
//
//  This is the single biggest UX/intelligence leap WorldScope can
//  make over WorldMonitor. WorldMonitor is reactive. WorldScope can
//  be predictive.
//
// ═══════════════════════════════════════════════════════════════════

import { CAUSAL_RULES_LIST } from "./impact-chain";

// Minimum probability to surface a forward prediction. Originally 0.6
// but that excluded legitimate Tier-2 source cascades where reliability
// caps the final probability at ~0.59 (e.g. Kandilli 0.80 × chain 0.85 ×
// conv 0.88 = 0.598). Lowered to 0.55 to include these.
const MIN_FORWARD_CONFIDENCE = 0.55;

export interface PredictedFollowup {
  /** The category we expect to see next */
  predictedCategory: Category;
  /** Probability based on rule confidence × trigger reliability */
  probability: number;
  /** Expected window (ms) within which this should manifest */
  expectedWindowMs: number;
  /** Human-readable reasoning */
  reasoning: string;
  /** The event that triggered this prediction */
  triggerEventId: string;
  /** Timestamp when this prediction was generated */
  generatedAt: string;
  /** Timestamp by which we should declare it "missed" */
  expiresAt: string;
}

/**
 * Given a high-confidence trigger event, generate forward predictions
 * for what categories should appear next within their expected
 * windows.
 *
 * @param trigger     the event that triggered the prediction
 * @param triggerConfidence overall convergence confidence (we don't
 *                    predict from low-confidence triggers — too noisy)
 * @param now         optional reference time (for tests)
 */
export function predictFollowups(
  trigger: ClusterEvent,
  triggerConfidence: number = 1.0,
  now: number = Date.now()
): PredictedFollowup[] {
  // Don't generate predictions from weak triggers
  if (triggerConfidence < 0.5) return [];

  const outgoing = CAUSAL_RULES_LIST.filter(
    (r) => r.from === trigger.category && r.confidence >= MIN_FORWARD_CONFIDENCE
  );

  const predictions: PredictedFollowup[] = [];

  for (const rule of outgoing) {
    // Probability scales with both rule strength and trigger reliability
    const probability =
      rule.confidence * trigger.reliability * triggerConfidence;
    if (probability < MIN_FORWARD_CONFIDENCE) continue;

    const windowMs = CATEGORY_TIME_WINDOWS[rule.to];
    const generatedAt = new Date(now).toISOString();
    const expiresAt = new Date(now + windowMs).toISOString();

    predictions.push({
      predictedCategory: rule.to,
      probability: Math.round(probability * 100) / 100,
      expectedWindowMs: windowMs,
      reasoning: rule.description,
      triggerEventId: trigger.eventId,
      generatedAt,
      expiresAt,
    });
  }

  return predictions.sort((a, b) => b.probability - a.probability);
}

// ── Validation: did a prediction come true? ─────────────────────────

export interface PredictionValidation {
  prediction: PredictedFollowup;
  matched: boolean;
  matchingEventId?: string;
  matchedAt?: string;
}

/**
 * Check whether any of the given recent events validate the
 * predictions. A "match" requires:
 *   - same predicted category
 *   - arrived within the expected window
 *   - arrived AFTER the trigger
 */
export function validatePredictions(
  predictions: PredictedFollowup[],
  recentEvents: ClusterEvent[],
  now: number = Date.now()
): PredictionValidation[] {
  return predictions.map((pred) => {
    const expiry = new Date(pred.expiresAt).getTime();
    if (now > expiry) {
      return { prediction: pred, matched: false };
    }
    const generatedAt = new Date(pred.generatedAt).getTime();
    const match = recentEvents.find((e) => {
      if (e.category !== pred.predictedCategory) return false;
      const ts = new Date(e.publishedAt).getTime();
      return ts >= generatedAt && ts <= expiry;
    });
    if (match) {
      return {
        prediction: pred,
        matched: true,
        matchingEventId: match.eventId,
        matchedAt: match.publishedAt,
      };
    }
    return { prediction: pred, matched: false };
  });
}

/**
 * Compute a "validation bonus" for a convergence: the fraction of its
 * predictions that were confirmed by subsequent events. Used by the
 * scorer to upgrade convergences whose forward predictions hit.
 *
 * Returns a number in [0, 1].
 */
export function predictionValidationRate(
  validations: PredictionValidation[]
): number {
  if (validations.length === 0) return 0;
  const matched = validations.filter((v) => v.matched).length;
  return matched / validations.length;
}
