import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const TTL = {
  MARKET: 60,
  NEWS: 180,      // 3 min — keep feed fresh
  FIVE_MIN: 300,  // 5 min — convergence scan
  RSS: 600,       // 10 min
  THREAT: 300,
  AI_BRIEF: 3600,
} as const;

export { redis };

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached) return cached;

  const data = await fetcher();
  await redis.set(key, data, { ex: ttl });
  return data;
}
