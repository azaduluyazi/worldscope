import type { Category } from "@/types/intel";

// ═══════════════════════════════════════════════════════════════════
//  Category-Aware Time Windows & Geographic Radii
// ═══════════════════════════════════════════════════════════════════
//
//  PROBLEM v1 had:
//  ---------------
//  correlation-detector used a single GEO_RADIUS_KM = 50 and a single
//  TIME_WINDOW_MS = 2h for ALL category pairs. But:
//
//    • Finance reactions happen in MINUTES (a market move ripples in
//      under 30s). 2h is way too wide → noise.
//
//    • Diplomacy responses unfold in DAYS. 2h is way too narrow →
//      misses the obvious cascades.
//
//    • An earthquake's effects extend ~500km. 50km misses M7+ ripples.
//
//    • A protest is contained to a neighborhood (~5km). 50km falsely
//      groups separate protests as one event.
//
//  SOLUTION:
//  ---------
//  Per-category windows. When two events of different categories are
//  being correlated, we use the LARGER window (slower category sets
//  the tempo). Same logic for geo radius.
//
// ═══════════════════════════════════════════════════════════════════

const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;

/**
 * Maximum time gap (ms) between two events of this category for them
 * to still be considered "correlated". Calibrated by domain logic:
 *
 *   - Finance: 30 min — markets react in seconds, full ripple in <1h
 *   - Cyber:   6h     — incident discovery + disclosure cycle
 *   - Energy:  3h     — supply disruption to price reaction
 *   - Natural: 4h     — disaster + initial response phase
 *   - Conflict: 6h    — combat operations + reporting cycle
 *   - Aviation: 2h    — incident + initial diversion impact
 *   - Health:  12h    — outbreak + initial reporting
 *   - Protest: 6h     — gathering + escalation phase
 *   - Diplomacy: 24h  — statement + responses unfold over a day
 *   - Tech:    8h     — release + adoption signal
 *   - Sports:  4h     — event + post-event reactions
 */
export const CATEGORY_TIME_WINDOWS: Record<Category, number> = {
  finance:   30 * MIN,
  cyber:     6 * HOUR,
  energy:    3 * HOUR,
  natural:   4 * HOUR,
  conflict:  6 * HOUR,
  aviation:  2 * HOUR,
  health:    12 * HOUR,
  protest:   6 * HOUR,
  diplomacy: 24 * HOUR,
  tech:      8 * HOUR,
  sports:    4 * HOUR,
};

/**
 * Maximum geographic radius (km) within which two events of this
 * category can still be considered part of the same cluster. Calibrated
 * by domain physics & social dynamics:
 *
 *   - Natural: 500km — earthquakes/storms have wide-area impact
 *   - Conflict: 200km — military operations + secondary effects
 *   - Energy:  300km — grid + pipeline networks span regions
 *   - Aviation: 200km — affected airspace radius
 *   - Health:  300km — disease spread + healthcare regional response
 *   - Protest: 25km  — typically contained to a city center
 *   - Cyber:   1000km — minimal geo meaning, but limit cross-region
 *   - Finance: 500km — markets are regional (NY, EU, ASIA)
 *   - Diplomacy: 1000km — capital-level events ripple far
 *   - Tech:    1000km — tech ecosystems are regional
 *   - Sports:  100km  — single-city events
 */
export const CATEGORY_GEO_RADIUS_KM: Record<Category, number> = {
  natural:   500,
  conflict:  200,
  energy:    300,
  aviation:  200,
  health:    300,
  protest:   25,
  cyber:     1000,
  finance:   500,
  diplomacy: 1000,
  tech:      1000,
  sports:    100,
};

/**
 * For a PAIR of categories, return the time window to use.
 * The slower category sets the tempo (max of the two).
 */
export function getTimeWindowForPair(a: Category, b: Category): number {
  return Math.max(CATEGORY_TIME_WINDOWS[a], CATEGORY_TIME_WINDOWS[b]);
}

/**
 * For a PAIR of categories, return the geo radius to use.
 * The wider category dominates (max).
 */
export function getGeoRadiusForPair(a: Category, b: Category): number {
  return Math.max(CATEGORY_GEO_RADIUS_KM[a], CATEGORY_GEO_RADIUS_KM[b]);
}

/**
 * For a SET of categories (a cluster being evaluated), return the
 * effective time window (max across all pairs).
 */
export function getTimeWindowForSet(categories: Category[]): number {
  if (categories.length === 0) return 2 * HOUR; // safe default
  return Math.max(...categories.map((c) => CATEGORY_TIME_WINDOWS[c]));
}

/**
 * For a SET of categories, return the effective geo radius.
 */
export function getGeoRadiusForSet(categories: Category[]): number {
  if (categories.length === 0) return 50;
  return Math.max(...categories.map((c) => CATEGORY_GEO_RADIUS_KM[c]));
}
