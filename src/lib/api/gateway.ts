/**
 * API Gateway — Centralized request handling for all data sources.
 *
 * Dual-layer circuit breaker:
 *   L1: In-memory Map (fast path, no Redis round-trip)
 *   L2: Redis persistence (survives serverless cold starts)
 *
 * On state change (failure/open/close), writes to Redis.
 * On cold start, restores from Redis.
 */

import { redis } from "@/lib/cache/redis";
import { circuitKey } from "@/lib/cache/keys";

interface CircuitState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

/**
 * Stale cache: stores last successful response per source.
 * When circuit opens, returns stale data instead of empty arrays.
 * This prevents dashboards from showing "OFFLINE" when a source
 * has temporary issues — users see slightly outdated data instead.
 */
const staleCache: Map<string, { data: unknown; fetchedAt: number }> = new Map();
const STALE_MAX_AGE_MS = 30 * 60_000; // serve stale data up to 30 min old

/* L1: In-memory fast cache */
const circuits: Map<string, CircuitState> = new Map();

const CIRCUIT_THRESHOLD = 5;     // failures before opening
const CIRCUIT_RESET_MS = 60_000; // 1 min cooldown
const CIRCUIT_REDIS_TTL = 120;   // Redis state expires after 2 min

/**
 * Restore circuit state from Redis (cold start recovery).
 * Called lazily on first access per sourceId.
 */
async function restoreFromRedis(sourceId: string): Promise<CircuitState> {
  try {
    const stored = await redis.get<CircuitState>(circuitKey(sourceId));
    if (stored) {
      circuits.set(sourceId, stored);
      return stored;
    }
  } catch {
    // Redis unavailable — proceed with clean state
  }
  return { failures: 0, lastFailure: 0, isOpen: false };
}

/**
 * Persist circuit state to Redis (fire-and-forget on state change).
 */
function persistToRedis(sourceId: string, state: CircuitState): void {
  redis
    .set(circuitKey(sourceId), state, { ex: CIRCUIT_REDIS_TTL })
    .catch(() => {
      // Non-critical — L1 still works
    });
}

/**
 * Execute a data source fetch with dual-layer circuit breaker.
 * If a source fails repeatedly, it's temporarily disabled.
 *
 * L1 (memory): checked first, zero latency
 * L2 (Redis): checked on cold start, ~2ms latency
 */
export async function gatewayFetch<T>(
  sourceId: string,
  fetcher: () => Promise<T>,
  options?: { timeoutMs?: number; fallback?: T }
): Promise<T> {
  // L1: Check in-memory state, or restore from Redis
  let state = circuits.get(sourceId);
  if (!state) {
    state = await restoreFromRedis(sourceId);
  }

  // Check circuit breaker
  if (state.isOpen) {
    if (Date.now() - state.lastFailure > CIRCUIT_RESET_MS) {
      // Half-open: allow one attempt
      state.isOpen = false;
      state.failures = 0;
    } else {
      // Circuit open — try stale cache first, then fallback
      const stale = staleCache.get(sourceId);
      if (stale && Date.now() - stale.fetchedAt < STALE_MAX_AGE_MS) {
        return stale.data as T;
      }
      if (options?.fallback !== undefined) return options.fallback;
      return [] as unknown as T;
    }
  }

  try {
    const timeoutMs = options?.timeoutMs || 10_000;
    const result = await Promise.race([
      fetcher(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout: ${sourceId}`)), timeoutMs)
      ),
    ]);

    // Success — reset failures + update stale cache
    const wasOpen = state.isOpen;
    state.failures = 0;
    state.isOpen = false;
    circuits.set(sourceId, state);

    // Cache successful response for stale-while-error
    staleCache.set(sourceId, { data: result, fetchedAt: Date.now() });

    // Persist recovery to Redis (only if state changed)
    if (wasOpen) persistToRedis(sourceId, state);

    return result;
  } catch {
    // Failure — increment counter
    state.failures++;
    state.lastFailure = Date.now();
    const becameOpen = !state.isOpen && state.failures >= CIRCUIT_THRESHOLD;
    if (state.failures >= CIRCUIT_THRESHOLD) {
      state.isOpen = true;
    }
    circuits.set(sourceId, state);

    // Persist state change to Redis
    if (becameOpen || state.failures === 1) {
      persistToRedis(sourceId, state);
    }

    // Try stale cache before returning empty fallback
    const stale = staleCache.get(sourceId);
    if (stale && Date.now() - stale.fetchedAt < STALE_MAX_AGE_MS) {
      return stale.data as T;
    }
    if (options?.fallback !== undefined) return options.fallback;
    return [] as unknown as T;
  }
}

/**
 * Get health status of all tracked data sources.
 */
export function getGatewayHealth(): Array<{
  sourceId: string;
  failures: number;
  isOpen: boolean;
  lastFailure: string | null;
}> {
  return [...circuits.entries()].map(([sourceId, state]) => ({
    sourceId,
    failures: state.failures,
    isOpen: state.isOpen,
    lastFailure: state.lastFailure ? new Date(state.lastFailure).toISOString() : null,
  }));
}

/**
 * Reset a specific circuit (for manual recovery).
 * Clears both L1 and L2.
 */
export function resetCircuit(sourceId: string): void {
  circuits.delete(sourceId);
  redis.del(circuitKey(sourceId)).catch(() => {});
}
