/**
 * Seed Utility Module — Foundation for the seed-first data architecture.
 *
 * Seed scripts pre-populate Redis with upstream API data on a schedule.
 * API routes then read from cache (near-instant) with upstream fetch as fallback.
 *
 * This module provides:
 *   - Atomic publish (data + metadata in a single pipeline)
 *   - Distributed locking (prevent concurrent seed runs)
 *   - Freshness tracking (seed-meta per key)
 *   - Health reporting (scan all seeds for staleness)
 */

import { redis } from "@/lib/cache/redis";
import { SEED_KEYS } from "@/lib/cache/keys";

/* ─── Types ─── */

export interface SeedMeta {
  fetchedAt: string;      // ISO timestamp
  recordCount: number;    // items in the seeded dataset
  ttl: number;            // configured TTL in seconds
  source: string;         // seed identifier (e.g. "seed-market")
  durationMs?: number;    // how long the upstream fetch took
}

export interface SeedHealthEntry {
  key: string;
  meta: SeedMeta | null;
  status: "fresh" | "stale" | "missing" | "expired";
  ageSeconds: number | null;
  maxStaleSeconds: number;
}

/* ─── Core Functions ─── */

/**
 * Atomically publish seeded data + metadata to Redis.
 *
 * Uses Redis pipeline to write both in a single round-trip.
 * The meta key outlives the data key (2x TTL) so health checks
 * can detect when a seed has expired without re-fetching.
 */
export async function seedPublish<T>(
  key: string,
  data: T,
  ttl: number,
  source: string
): Promise<SeedMeta> {
  const startTime = Date.now();
  const recordCount = Array.isArray(data) ? data.length : 1;

  const meta: SeedMeta = {
    fetchedAt: new Date().toISOString(),
    recordCount,
    ttl,
    source,
    durationMs: Date.now() - startTime,
  };

  const metaKey = `seed-meta:${key}`;

  // Pipeline: atomic write of data + meta
  const pipeline = redis.pipeline();
  pipeline.set(key, data, { ex: ttl });
  pipeline.set(metaKey, meta, { ex: ttl * 2 }); // meta outlives data
  await pipeline.exec();

  return meta;
}

/**
 * Read seed metadata for a specific key.
 */
export async function seedMeta(key: string): Promise<SeedMeta | null> {
  return redis.get<SeedMeta>(`seed-meta:${key}`);
}

/**
 * Acquire a distributed lock to prevent concurrent seed runs.
 *
 * Uses Redis SET NX (set if not exists) with a TTL.
 * Returns true if lock was acquired, false if another process holds it.
 */
export async function acquireSeedLock(
  key: string,
  ttlMs: number = 30_000
): Promise<boolean> {
  const lockKey = `seed-lock:${key}`;
  const result = await redis.set(lockKey, "1", {
    nx: true,
    px: ttlMs,
  });
  return result === "OK";
}

/**
 * Release a seed lock (call in finally block).
 */
export async function releaseSeedLock(key: string): Promise<void> {
  await redis.del(`seed-lock:${key}`);
}

/**
 * Read seeded data from Redis. Returns null if not found.
 * This is the primary read path for seed-first API routes.
 */
export async function seedRead<T>(key: string): Promise<T | null> {
  return redis.get<T>(key);
}

/**
 * Scan all seed-meta keys and produce a health report.
 *
 * For each seed, determines if data is:
 *   - fresh:   within TTL
 *   - stale:   beyond TTL but meta still exists (data expired, meta hasn't)
 *   - missing: no meta key at all (never seeded)
 *   - expired: meta also expired (both data and meta gone)
 */
export async function seedHealth(
  knownKeys: Array<{ key: string; maxStaleSeconds: number }>
): Promise<SeedHealthEntry[]> {
  const results: SeedHealthEntry[] = [];

  for (const { key, maxStaleSeconds } of knownKeys) {
    const meta = await seedMeta(key);

    if (!meta) {
      results.push({
        key,
        meta: null,
        status: "missing",
        ageSeconds: null,
        maxStaleSeconds,
      });
      continue;
    }

    const ageSeconds = Math.floor(
      (Date.now() - new Date(meta.fetchedAt).getTime()) / 1000
    );

    let status: SeedHealthEntry["status"];
    if (ageSeconds <= meta.ttl) {
      status = "fresh";
    } else if (ageSeconds <= maxStaleSeconds) {
      status = "stale";
    } else {
      status = "expired";
    }

    results.push({ key, meta, status, ageSeconds, maxStaleSeconds });
  }

  return results;
}

/**
 * Helper: run a seeder function with lock + error handling.
 *
 * Usage in cron routes:
 *   return runSeeder("seed-market", 30_000, async () => {
 *     const data = await gatewayFetch(...);
 *     await seedPublish(SEED_KEYS.market.quotes, data, TTL.FAST, "seed-market");
 *     return { quotes: data.length };
 *   });
 */
export async function runSeeder<T>(
  seedId: string,
  lockTtlMs: number,
  fn: () => Promise<T>
): Promise<{ success: boolean; seedId: string; result?: T; error?: string; skipped?: boolean }> {
  const locked = await acquireSeedLock(seedId, lockTtlMs);
  if (!locked) {
    return { success: true, seedId, skipped: true };
  }

  try {
    const result = await fn();
    return { success: true, seedId, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[SEED] ${seedId} failed:`, message);
    return { success: false, seedId, error: message };
  } finally {
    await releaseSeedLock(seedId);
  }
}
