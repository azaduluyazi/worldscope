import { redis } from "@/lib/cache/redis";
import type { ConvergencePrediction, ClusterEvent } from "./types";

// ═══════════════════════════════════════════════════════════════════
//  Predictions Store (Redis-backed)
// ═══════════════════════════════════════════════════════════════════
//
//  Persists active forward predictions across cron runs so the
//  counter-factual detector can ask "did the predictions we made an
//  hour ago actually come true — and if not, why not?"
//
//  Storage model:
//    Key:   pred:{convergenceId}:{predictionIdx}
//    Value: serialized ConvergencePrediction (JSON)
//    TTL:   expectedWindowMs + 1h grace period
//
//  We also maintain an INDEX key (set) of all active prediction IDs
//  so the validator can iterate efficiently without SCAN.
//
//  Index key: pred:active
//
// ═══════════════════════════════════════════════════════════════════

const PREDICTION_PREFIX = "pred:";
const INDEX_KEY = "pred:active";
const GRACE_MS = 60 * 60 * 1000; // 1h grace period after expiry

interface StoredPrediction extends ConvergencePrediction {
  convergenceId: string;
  predictionIdx: number;
}

function makeKey(convergenceId: string, idx: number): string {
  return `${PREDICTION_PREFIX}${convergenceId}:${idx}`;
}

/**
 * Store a batch of predictions for a freshly-built convergence.
 * Each prediction gets its own Redis key so the validator can
 * pipeline lookups efficiently.
 */
export async function storePredictions(
  convergenceId: string,
  predictions: ConvergencePrediction[]
): Promise<void> {
  if (predictions.length === 0) return;
  const now = Date.now();

  for (let i = 0; i < predictions.length; i++) {
    const pred = predictions[i];
    const expiry = new Date(pred.expiresAt).getTime();
    const ttlSeconds = Math.max(60, Math.floor((expiry - now + GRACE_MS) / 1000));
    const stored: StoredPrediction = {
      ...pred,
      convergenceId,
      predictionIdx: i,
    };
    const key = makeKey(convergenceId, i);
    await redis.set(key, stored, { ex: ttlSeconds });
    await redis.sadd(INDEX_KEY, key);
  }
  // Refresh the index TTL so it stays around as long as any active
  // prediction key exists.
  await redis.expire(INDEX_KEY, 48 * 60 * 60);
}

/**
 * Fetch all currently-active predictions across all convergences.
 * Used by the counter-factual scan to evaluate which predictions
 * have come true and which have expired without being validated.
 */
export async function fetchActivePredictions(): Promise<StoredPrediction[]> {
  try {
    const keys = (await redis.smembers(INDEX_KEY)) as string[];
    if (!keys || keys.length === 0) return [];

    const results: StoredPrediction[] = [];
    const stale: string[] = [];

    for (const key of keys) {
      const value = await redis.get<StoredPrediction>(key);
      if (value) {
        results.push(value);
      } else {
        // Key expired or was deleted — remove from index
        stale.push(key);
      }
    }

    if (stale.length > 0) {
      await redis.srem(INDEX_KEY, ...stale);
    }

    return results;
  } catch (err) {
    console.error("[predictions-store.fetchActive] error:", err);
    return [];
  }
}

/**
 * Remove a prediction from the store (used after validation or
 * counter-factual classification).
 */
export async function deletePrediction(
  convergenceId: string,
  predictionIdx: number
): Promise<void> {
  try {
    const key = makeKey(convergenceId, predictionIdx);
    await redis.del(key);
    await redis.srem(INDEX_KEY, key);
  } catch (err) {
    console.error("[predictions-store.delete] error:", err);
  }
}

// ═══════════════════════════════════════════════════════════════════
//  Validation + cleanup pipeline
// ═══════════════════════════════════════════════════════════════════

const VALIDATED_RECENT_KEY = "predictions:validated:recent";
const VALIDATED_RECENT_TTL_SECONDS = 24 * 60 * 60;
const VALIDATED_RECENT_MAX = 100;

export interface ValidatedPrediction {
  prediction: StoredPrediction;
  matchingEventId: string;
  matchingEventTitle: string;
  matchedAt: string;
  validatedAt: string;
}

export interface ValidationOutcome {
  /** Predictions that matched a current-window event */
  validated: ValidatedPrediction[];
  /** Predictions whose window expired without a match (counter-factual fodder) */
  expired: StoredPrediction[];
  /** Predictions still pending (window not yet expired, no match yet) */
  stillPending: StoredPrediction[];
}

/**
 * Validate stored predictions against a fresh batch of cluster events
 * and clean up the store accordingly.
 *
 *  - matched → moved to predictions:validated:recent + deleted
 *  - expired (window over, no match) → deleted (counter-factual handles)
 *  - pending → left in store
 *
 * Caller is the cron route. This is the function that fixes the
 * "predictions never get marked validated and the store grows
 * forever" problem.
 */
export async function validateAndCleanup(
  activePredictions: StoredPrediction[],
  recentEvents: ClusterEvent[],
  now: number = Date.now()
): Promise<ValidationOutcome> {
  const validated: ValidatedPrediction[] = [];
  const expired: StoredPrediction[] = [];
  const stillPending: StoredPrediction[] = [];

  for (const pred of activePredictions) {
    const generatedAt = new Date(pred.generatedAt).getTime();
    const expiresAt = new Date(pred.expiresAt).getTime();

    // Look for a matching event in the prediction window
    const match = recentEvents.find((e) => {
      if (e.category !== pred.predictedCategory) return false;
      const ts = new Date(e.publishedAt).getTime();
      return ts >= generatedAt && ts <= expiresAt;
    });

    if (match) {
      validated.push({
        prediction: pred,
        matchingEventId: match.eventId,
        matchingEventTitle: match.title,
        matchedAt: match.publishedAt,
        validatedAt: new Date(now).toISOString(),
      });
      await deletePrediction(pred.convergenceId, pred.predictionIdx);
      continue;
    }

    if (now > expiresAt) {
      expired.push(pred);
      await deletePrediction(pred.convergenceId, pred.predictionIdx);
      continue;
    }

    stillPending.push(pred);
  }

  // Push validated predictions to a rolling 24h list for the UI
  if (validated.length > 0) {
    try {
      const existing =
        (await redis.get<ValidatedPrediction[]>(VALIDATED_RECENT_KEY)) ?? [];
      const merged = [...validated, ...existing].slice(0, VALIDATED_RECENT_MAX);
      await redis.set(VALIDATED_RECENT_KEY, merged, {
        ex: VALIDATED_RECENT_TTL_SECONDS,
      });
    } catch (err) {
      console.error("[predictions-store.validateAndCleanup] write error:", err);
    }
  }

  return { validated, expired, stillPending };
}

/**
 * Read the rolling list of recently validated predictions for the
 * UI/email surfaces. Returned newest-first.
 */
export async function fetchRecentValidations(): Promise<ValidatedPrediction[]> {
  try {
    return (await redis.get<ValidatedPrediction[]>(VALIDATED_RECENT_KEY)) ?? [];
  } catch (err) {
    console.error("[predictions-store.fetchRecentValidations] error:", err);
    return [];
  }
}

export type { StoredPrediction };
