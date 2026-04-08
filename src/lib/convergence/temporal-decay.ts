import type { Category, Severity } from "@/types/intel";

// ═══════════════════════════════════════════════════════════════════
//  Temporal Decay — Recency-Weighted Signal Strength
// ═══════════════════════════════════════════════════════════════════
//
//  PROBLEM v1 had:
//  ---------------
//  scorer.ts treated a 5-min-old event identically to a 5-hour-old
//  event. But fresh signals carry MORE information about an unfolding
//  situation. A finance event from 4 hours ago is stale; a new finance
//  event RIGHT NOW says "this is still developing".
//
//  SOLUTION:
//  ---------
//  Exponential decay: weight(age) = exp(-age / half_life)
//
//  At age = half_life, weight = 0.5. At 2x half_life, weight = 0.25.
//
//  Half-life is a DUAL MATRIX of category × severity:
//    - Critical events decay slower (they stay relevant longer)
//    - Fast-moving categories (finance) decay faster than slow ones
//      (diplomacy)
//
//  This is the most important math change to scorer.ts. Combined with
//  the syndication dampener, it's what cuts false positives.
//
// ═══════════════════════════════════════════════════════════════════

const HOUR = 60 * 60 * 1000;

/**
 * Half-life table: category × severity → milliseconds.
 * Severity multiplies the base half-life:
 *   critical: 2.0x  high: 1.5x  medium: 1.0x  low: 0.6x  info: 0.4x
 */
const BASE_HALF_LIFE: Record<Category, number> = {
  finance:   1 * HOUR,
  cyber:     3 * HOUR,
  energy:    2 * HOUR,
  natural:   6 * HOUR,
  conflict:  6 * HOUR,
  aviation:  2 * HOUR,
  health:    8 * HOUR,
  protest:   3 * HOUR,
  diplomacy: 12 * HOUR,
  tech:      4 * HOUR,
  sports:    2 * HOUR,
};

const SEVERITY_HALF_LIFE_MULTIPLIER: Record<Severity, number> = {
  critical: 2.0,
  high:     1.5,
  medium:   1.0,
  low:      0.6,
  info:     0.4,
};

/**
 * Get the half-life for a given category × severity combination.
 * Exposed for tests and the debug UI.
 */
export function getHalfLife(category: Category, severity: Severity): number {
  return BASE_HALF_LIFE[category] * SEVERITY_HALF_LIFE_MULTIPLIER[severity];
}

/**
 * Compute the temporal decay weight for an event.
 *
 * Returns a number in (0, 1]:
 *   - 1.0 for a fresh event (age = 0)
 *   - 0.5 at half-life
 *   - 0.25 at 2x half-life
 *   - asymptotically → 0 as age grows
 *
 * @param publishedAt ISO timestamp of the event
 * @param category    event category (sets base half-life)
 * @param severity    event severity (modulates half-life)
 * @param now         optional reference time (defaults to Date.now()) — for tests
 */
export function temporalDecayWeight(
  publishedAt: string,
  category: Category,
  severity: Severity,
  now: number = Date.now()
): number {
  const ageMs = now - new Date(publishedAt).getTime();
  if (ageMs <= 0) return 1.0; // future-dated or now
  const halfLife = getHalfLife(category, severity);
  // weight = 0.5 ^ (age / halfLife) = exp(-age * ln(2) / halfLife)
  return Math.exp(-ageMs * Math.LN2 / halfLife);
}

/**
 * Convenience: clamp very small decay weights to a floor so that
 * a single very-old signal can't completely vanish.
 * Prevents numerical issues in Bayesian log-odds aggregation.
 */
export function temporalDecayWeightFloored(
  publishedAt: string,
  category: Category,
  severity: Severity,
  floor: number = 0.05,
  now: number = Date.now()
): number {
  return Math.max(floor, temporalDecayWeight(publishedAt, category, severity, now));
}
