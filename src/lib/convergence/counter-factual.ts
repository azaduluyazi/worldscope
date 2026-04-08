import type { Category } from "@/types/intel";
import type { ClusterEvent, ConvergencePrediction } from "./types";
import type { StoredPrediction } from "./predictions-store";

// ═══════════════════════════════════════════════════════════════════
//  Counter-Factual Convergence Detector
// ═══════════════════════════════════════════════════════════════════
//
//  THE INSIGHT:
//  ------------
//  Forward predictions tell us "X is expected to follow". When the
//  prediction's window expires without a matching event, that absence
//  is ITSELF a signal:
//
//    1. The prediction was wrong (rule needs updating, or the trigger
//       was misclassified).
//
//    2. The expected reaction was suppressed by something — markets
//       already priced it in, the conflict report was fake, the
//       cascade was averted by intervention.
//
//    3. There's a delayed reaction we should keep watching for.
//
//  All three are USEFUL information that our competitors don't surface.
//  This is the differentiator. The convergence engine becomes a system
//  that flags both WHAT HAPPENED and WHAT DIDN'T.
//
// ═══════════════════════════════════════════════════════════════════

const HIGH_CONFIDENCE_THRESHOLD = 0.7;

export type CounterFactualKind =
  | "missing_reaction"      // High-prob prediction did not materialize
  | "absent_signal"         // Strong trigger but no expected category
  | "premature_silence";    // Window halfway gone with no signal yet (early warning)

export interface CounterFactualSignal {
  kind: CounterFactualKind;
  /** The original prediction that didn't validate */
  prediction: StoredPrediction;
  /** Why we surfaced this anomaly */
  reasoning: string;
  /** Severity of the anomaly (cosmetic — drives UI emphasis) */
  severity: "info" | "elevated" | "high";
  /** Detected at */
  detectedAt: string;
}

/**
 * Scan a list of stored predictions against a current event window
 * and identify which predictions did NOT validate. The returned list
 * is the counter-factual signal set.
 *
 * @param activePredictions  predictions currently in the Redis store
 * @param recentEvents       events from the last N hours
 * @param now                optional reference time (for tests)
 */
export function detectCounterFactuals(
  activePredictions: StoredPrediction[],
  recentEvents: ClusterEvent[],
  now: number = Date.now()
): CounterFactualSignal[] {
  const signals: CounterFactualSignal[] = [];

  for (const pred of activePredictions) {
    const expiry = new Date(pred.expiresAt).getTime();
    const generated = new Date(pred.generatedAt).getTime();
    const windowMs = expiry - generated;

    // Check if any matching event exists in the time window
    const matched = recentEvents.find((e) => {
      if (e.category !== pred.predictedCategory) return false;
      const ts = new Date(e.publishedAt).getTime();
      return ts >= generated && ts <= expiry;
    });

    if (matched) continue; // Validated — not a counter-factual

    // Branch 1: window FULLY expired and no match
    if (now > expiry) {
      // Only flag HIGH-PROBABILITY misses — low-prob misses are not news
      if (pred.probability >= HIGH_CONFIDENCE_THRESHOLD) {
        signals.push({
          kind: "missing_reaction",
          prediction: pred,
          reasoning:
            `Predicted ${pred.predictedCategory} signal with ${Math.round(
              pred.probability * 100
            )}% probability did not appear within the expected window. ` +
            `Possible explanations: market pre-priced, trigger over-classified, ` +
            `cascade interrupted, or delayed reaction.`,
          severity: pred.probability >= 0.85 ? "high" : "elevated",
          detectedAt: new Date(now).toISOString(),
        });
      }
      continue;
    }

    // Branch 2: window halfway done — early warning for high-confidence preds
    const elapsed = now - generated;
    const ratio = elapsed / windowMs;
    if (ratio >= 0.5 && pred.probability >= 0.85) {
      signals.push({
        kind: "premature_silence",
        prediction: pred,
        reasoning:
          `Halfway through the expected window with no ${pred.predictedCategory} signal yet. ` +
          `If the cascade is happening, it should be visible by now.`,
        severity: "info",
        detectedAt: new Date(now).toISOString(),
      });
    }
  }

  return signals;
}

/**
 * Given a fresh batch of high-confidence triggers, additionally check
 * whether the recent event window LACKS the expected cross-category
 * signals. This catches "absent signal" anomalies that don't depend on
 * stored predictions — useful for the very first run after deploy
 * before the predictions store has any data.
 */
export function detectAbsentExpectedSignals(
  triggers: ClusterEvent[],
  expectedCategories: Map<Category, Category[]>,
  recentEvents: ClusterEvent[],
  windowMs: number = 4 * 60 * 60 * 1000,
  now: number = Date.now()
): CounterFactualSignal[] {
  const signals: CounterFactualSignal[] = [];

  for (const trigger of triggers) {
    const expected = expectedCategories.get(trigger.category) ?? [];
    const triggerTime = new Date(trigger.publishedAt).getTime();
    if (now - triggerTime < windowMs / 2) continue; // too early to check

    const presentCategories = new Set(
      recentEvents
        .filter((e) => {
          const ts = new Date(e.publishedAt).getTime();
          return ts >= triggerTime && ts <= triggerTime + windowMs;
        })
        .map((e) => e.category)
    );

    for (const expectedCat of expected) {
      if (presentCategories.has(expectedCat)) continue;

      // Manufacture a synthetic prediction to wrap in a CF signal
      const syntheticPred: StoredPrediction = {
        predictedCategory: expectedCat,
        probability: 0.8,
        expectedWindowMs: windowMs,
        reasoning: `Expected after ${trigger.category} trigger`,
        triggerEventId: trigger.eventId,
        generatedAt: trigger.publishedAt,
        expiresAt: new Date(triggerTime + windowMs).toISOString(),
        validated: false,
        convergenceId: `synthetic-${trigger.eventId}`,
        predictionIdx: 0,
      };

      signals.push({
        kind: "absent_signal",
        prediction: syntheticPred,
        reasoning:
          `Strong ${trigger.category} trigger did not produce the expected ` +
          `${expectedCat} response. Either the market was prepared, the ` +
          `trigger was over-classified, or the cascade was averted.`,
        severity: "elevated",
        detectedAt: new Date(now).toISOString(),
      });
    }
  }

  return signals;
}

/**
 * Convert a non-stored ConvergencePrediction into the StoredPrediction
 * shape used by the detector. Useful for tests and one-shot checks.
 */
export function asStored(
  convergenceId: string,
  pred: ConvergencePrediction,
  idx: number = 0
): StoredPrediction {
  return {
    ...pred,
    convergenceId,
    predictionIdx: idx,
  };
}
