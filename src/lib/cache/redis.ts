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
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  // L1: Redis cache hit
  const cached = await redis.get<T>(key);
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

  // L3: We are the leader — fetch, cache, and share
  const fetchPromise = (async (): Promise<T> => {
    const data = await fetcher();
    await redis.set(key, data, { ex: ttl });
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
