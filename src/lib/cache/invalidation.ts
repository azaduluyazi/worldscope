/**
 * Selective cache invalidation — flush specific data groups without
 * touching the entire Redis cache.
 */
import { redis } from "./redis";
import {
  SEED_PREFIXES,
  CONVERGENCE_PREFIX,
  INTEL_PREFIX,
} from "./keys";

type CacheGroup = "market" | "economic" | "cyber" | "aviation" | "natural" | "conflict" | "radiation" | "intel" | "all";

const GROUP_PREFIXES: Record<CacheGroup, string[]> = {
  market: [SEED_PREFIXES.market, "market:"],
  economic: [SEED_PREFIXES.economic, "economic:"],
  cyber: [SEED_PREFIXES.cyber, "cyber:"],
  aviation: [SEED_PREFIXES.flights, "flights:"],
  natural: [SEED_PREFIXES.natural, "weather:", "earthquake:"],
  conflict: [SEED_PREFIXES.conflict, "conflict:"],
  radiation: [SEED_PREFIXES.radiation, "radiation:"],
  intel: [INTEL_PREFIX, CONVERGENCE_PREFIX],
  all: [
    SEED_PREFIXES.all,
    "market:",
    "economic:",
    "cyber:",
    "flights:",
    "weather:",
    "conflict:",
    "radiation:",
    INTEL_PREFIX,
    CONVERGENCE_PREFIX,
  ],
};

export async function invalidateGroup(group: CacheGroup): Promise<{ deleted: number; group: string }> {
  const prefixes = GROUP_PREFIXES[group];
  let totalDeleted = 0;

  for (const prefix of prefixes) {
    // Upstash Redis supports SCAN with MATCH
    const keys = await scanKeys(`${prefix}*`);
    if (keys.length > 0) {
      // Delete in batches of 100
      for (let i = 0; i < keys.length; i += 100) {
        const batch = keys.slice(i, i + 100);
        const pipeline = redis.pipeline();
        for (const key of batch) {
          pipeline.del(key);
        }
        await pipeline.exec();
        totalDeleted += batch.length;
      }
    }
  }

  return { deleted: totalDeleted, group };
}

async function scanKeys(pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = 0;
  do {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [nextCursor, batch] = await (redis as any).scan(cursor, { match: pattern, count: 100 });
    cursor = Number(nextCursor);
    keys.push(...batch);
  } while (cursor !== 0);
  return keys;
}
