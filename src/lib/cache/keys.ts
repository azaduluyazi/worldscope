/**
 * Redis key registry — single source of truth for every cache key used
 * across the app. Scattered string literals are prone to drift (typos,
 * accidental collisions between feature areas, rename rot). Import from
 * here instead.
 *
 * Conventions:
 *   - Top-level prefix identifies the subsystem (`seed`, `convergence`,
 *     `circuit`, `rl`, `intel`).
 *   - Leaf segment identifies the specific slice.
 *   - Builders are exported for keys that embed a variable id.
 *
 * New keys SHOULD be declared here before first use. Grep
 * `src/lib/cache/keys.ts` to audit the surface.
 */

// ── Seed layer (cron publishers → dashboard consumers) ──
export const SEED_KEYS = {
  market: {
    quotes: "seed:market:quotes",
    crypto: "seed:market:crypto",
    fearGreed: "seed:market:fear-greed",
  },
  conflict: {
    acled: "seed:conflict:acled",
    gdelt: "seed:conflict:gdelt",
  },
  cyber: {
    threats: "seed:cyber:threats",
  },
  economic: {
    bis: "seed:economic:bis",
    fred: "seed:economic:fred",
    wb: "seed:economic:wb",
  },
  natural: {
    earthquakes: "seed:natural:earthquakes",
    fires: "seed:natural:fires",
    weather: "seed:natural:weather",
  },
  radiation: {
    readings: "seed:radiation:readings",
  },
  flights: {
    opensky: "seed:flights:opensky",
  },
} as const;

// ── Convergence engine ──
export const CONVERGENCE_KEYS = {
  latest: "convergence:latest",
  history: "convergence:history",
  counterFactuals: "convergence:counter-factuals",
} as const;

// ── Intel feed ──
export const INTEL_KEYS = {
  anomalies: "intel:anomalies",
} as const;

// ── Circuit breaker (gateway) ──
/** Per-source circuit breaker state. See src/lib/api/gateway.ts. */
export const circuitKey = (sourceId: string) => `circuit:${sourceId}`;

// ── Article extractor ──
/** Cache key for extracted article content, keyed on URL + lang. */
export const articleKey = (url: string, lang = "en") =>
  `article:${Buffer.from(url).toString("base64url").slice(0, 60)}:${lang}`;

// ── Rate limit prefixes (consumed by @upstash/ratelimit) ──
// Distinct prefixes guarantee independent counter budgets per limiter.
export const RATE_LIMIT_PREFIXES = {
  standard: "rl:standard",
  relaxed: "rl:relaxed",
  strict: "rl:strict",
  ai: "rl:ai",
} as const;

// ── Prefix families (for SCAN-based invalidation) ──
// These are *prefixes*, not complete keys — only used by cache
// invalidation (`src/lib/cache/invalidation.ts`). Pairing them with
// `SEED_KEYS` guarantees SCAN matchers stay aligned with publishers.
export const SEED_PREFIXES = {
  market: "seed:market:",
  conflict: "seed:conflict:",
  cyber: "seed:cyber:",
  economic: "seed:economic:",
  natural: "seed:natural:",
  radiation: "seed:radiation:",
  flights: "seed:flights:",
  all: "seed:",
} as const;

export const CONVERGENCE_PREFIX = "convergence:";
export const INTEL_PREFIX = "intel:";
