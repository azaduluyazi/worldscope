import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./cache/redis";

/**
 * Rate limiters for different API tiers.
 * Uses sliding window algorithm via Upstash Redis.
 *
 * Tiers:
 * - ai:       5 req / 60s  (expensive LLM calls)
 * - strict:  20 req / 60s  (data-heavy endpoints)
 * - standard: 60 req / 60s  (normal public APIs)
 * - relaxed: 120 req / 60s  (lightweight endpoints)
 */

export const rateLimiters = {
  /** AI endpoints — most expensive, tightest limit */
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    prefix: "rl:ai",
    analytics: true,
  }),

  /** Data-heavy endpoints (intel, market, threat) */
  strict: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "60 s"),
    prefix: "rl:strict",
    analytics: true,
  }),

  /** Standard public APIs */
  standard: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "60 s"),
    prefix: "rl:standard",
    analytics: true,
  }),

  /** Lightweight endpoints (health, locale, vitals) */
  relaxed: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(120, "60 s"),
    prefix: "rl:relaxed",
    analytics: true,
  }),
} as const;

/** Map API path patterns to rate limit tiers */
export type RateLimitTier = keyof typeof rateLimiters;

const ROUTE_TIERS: [RegExp, RateLimitTier][] = [
  // ── AI: tightest (5 req/min) ──
  [/^\/api\/ai\//, "ai"],
  [/^\/api\/translate/, "ai"],

  // ── Strict: data-heavy (20 req/min) ──
  [/^\/api\/intel/, "strict"],
  [/^\/api\/market/, "strict"],
  [/^\/api\/threat/, "strict"],
  [/^\/api\/sports/, "strict"],
  [/^\/api\/flights/, "strict"],
  [/^\/api\/vessels/, "strict"],
  [/^\/api\/weather/, "strict"],
  [/^\/api\/cyber-threats/, "strict"],
  [/^\/api\/predictions/, "strict"],
  [/^\/api\/economic/, "strict"],
  [/^\/api\/economics/, "strict"],
  [/^\/api\/fiscal/, "strict"],
  [/^\/api\/radiation/, "strict"],
  [/^\/api\/outages/, "strict"],
  [/^\/api\/trending/, "strict"],
  [/^\/api\/oref/, "strict"],
  [/^\/api\/bootstrap/, "strict"],

  // ── Standard: normal (60 req/min) ──
  [/^\/api\/feeds/, "standard"],
  [/^\/api\/analytics/, "standard"],
  [/^\/api\/errors/, "standard"],
  [/^\/api\/article/, "standard"],
  [/^\/api\/subscribe/, "standard"],
  [/^\/api\/newsletter/, "standard"],
  [/^\/api\/widget/, "standard"],
  [/^\/api\/admin\//, "standard"],

  // ── Relaxed: lightweight (120 req/min) ──
  [/^\/api\/health/, "relaxed"],
  [/^\/api\/locale/, "relaxed"],
  [/^\/api\/vitals/, "relaxed"],
  [/^\/api\/market-data/, "relaxed"],
];

/**
 * Get the rate limit tier for a given API path.
 * Returns null for cron/internal routes (they use Bearer auth).
 */
export function getTierForPath(pathname: string): RateLimitTier | null {
  // Skip cron routes — they have their own auth
  if (pathname.startsWith("/api/cron")) return null;
  // Skip OG image generation
  if (pathname.startsWith("/api/og")) return null;
  // Skip webhooks — external services need unrestricted access
  if (pathname.startsWith("/api/webhooks")) return null;
  if (pathname.startsWith("/api/payments/webhook")) return null;

  for (const [pattern, tier] of ROUTE_TIERS) {
    if (pattern.test(pathname)) return tier;
  }

  return "standard"; // default tier for unknown API routes
}

/**
 * Extract client identifier from request.
 * Uses X-Forwarded-For (Vercel), then falls back to IP.
 */
export function getClientId(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "anonymous";
}
