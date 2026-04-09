import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Cache TTL tiers — 6-level hierarchy matching data volatility.
 *
 *   REALTIME  →  flights, live vessel/aircraft positions
 *   FAST      →  market quotes, fear & greed
 *   MEDIUM    →  weather alerts, threat feeds, convergence
 *   SLOW      →  RSS feeds, conflict events, cyber threats
 *   STATIC    →  economic indicators, AI briefs, humanitarian
 *   DAILY     →  baselines, historical reference, minerals
 */
export const TTL = {
  REALTIME: 15,     // 15 sec — live tracking data
  FAST: 60,         // 1 min  — market quotes (was MARKET)
  MEDIUM: 300,      // 5 min  — weather, threats, convergence (was FIVE_MIN, THREAT)
  SLOW: 600,        // 10 min — RSS, conflict events (was RSS)
  STATIC: 3600,     // 1 hour — economic data, AI briefs (was AI_BRIEF)
  DAILY: 86_400,    // 24 hours — baselines, historical

  // ─── Legacy aliases (will be removed after full migration) ───
  /** @deprecated Use TTL.FAST */
  MARKET: 60,
  /** @deprecated Use TTL.MEDIUM */
  NEWS: 180,
  /** @deprecated Use TTL.MEDIUM */
  FIVE_MIN: 300,
  /** @deprecated Use TTL.MEDIUM */
  THREAT: 300,
  /** @deprecated Use TTL.STATIC */
  AI_BRIEF: 3600,
  /** @deprecated Use TTL.SLOW */
  RSS: 600,
} as const;

export { redis };

/* ─── In-flight request deduplication for stampede protection ─── */
const inflightRequests = new Map<string, Promise<unknown>>();

/**
 * Fetch with Redis cache and stampede protection.
 *
 * When multiple concurrent requests miss the cache for the same key,
 * only ONE upstream fetch fires. All others await the same promise.
 * After the fetch completes, the result is cached and the inflight
 * entry is cleaned up.
 *
 * Fallback: if the lock holder fails, waiters retry once before
 * bubbling the error.
 *
 * Session 17 resilience: Redis GET/SET errors (quota, network, timeout)
 * NEVER propagate — they are logged and the request falls through to
 * direct fetcher() execution. Redis becomes an optimization layer, not
 * a dependency. When Upstash free-tier quota exhausts mid-month, the
 * app continues serving (slower, no cache) instead of returning 500.
 * See https://upstash.com/docs/redis/troubleshooting/max_requests_limit
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  // L1: Redis cache hit — resilient to Redis failures
  let cached: T | null | undefined = null;
  try {
    cached = await redis.get<T>(key);
  } catch (e) {
    // Redis unavailable (quota, network, timeout) — log once, continue
    console.warn(`[cachedFetch] Redis GET failed for "${key}": ${(e as Error).message}`);
  }
  if (cached !== null && cached !== undefined) return cached;

  // L2: Coalesce concurrent misses (stampede protection)
  const inflight = inflightRequests.get(key) as Promise<T> | undefined;
  if (inflight) {
    try {
      return await inflight;
    } catch {
      // Lock holder failed — fall through to fetch ourselves
    }
  }

  // L3: We are the leader — fetch, try to cache (fire-and-forget), share
  const fetchPromise = (async (): Promise<T> => {
    const data = await fetcher();
    // Cache write is fire-and-forget. If Redis SET throws (quota, network),
    // we log and move on — the response is already computed and must reach
    // the client. Swallowing this error is critical: otherwise a full Redis
    // outage cascades into 500s across every cached endpoint.
    redis
      .set(key, data, { ex: ttl })
      .catch((e) =>
        console.warn(
          `[cachedFetch] Redis SET failed for "${key}": ${(e as Error).message}`
        )
      );
    return data;
  })();

  inflightRequests.set(key, fetchPromise);

  try {
    const result = await fetchPromise;
    return result;
  } finally {
    inflightRequests.delete(key);
  }
}
