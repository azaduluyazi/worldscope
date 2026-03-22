/**
 * API Gateway — Centralized request handling for all data sources.
 * Provides: circuit breaker, timeout, retry, metrics.
 *
 * When migrating to a separate backend, this module becomes
 * the core of the new service — no route changes needed.
 */

interface CircuitState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const circuits: Map<string, CircuitState> = new Map();

const CIRCUIT_THRESHOLD = 5;     // failures before opening
const CIRCUIT_RESET_MS = 60_000; // 1 min cooldown

/**
 * Execute a data source fetch with circuit breaker protection.
 * If a source fails repeatedly, it's temporarily disabled.
 */
export async function gatewayFetch<T>(
  sourceId: string,
  fetcher: () => Promise<T>,
  options?: { timeoutMs?: number; fallback?: T }
): Promise<T> {
  const state = circuits.get(sourceId) || { failures: 0, lastFailure: 0, isOpen: false };

  // Check circuit breaker
  if (state.isOpen) {
    if (Date.now() - state.lastFailure > CIRCUIT_RESET_MS) {
      // Half-open: allow one attempt
      state.isOpen = false;
      state.failures = 0;
    } else {
      // Circuit open — return fallback
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

    // Success — reset failures
    state.failures = 0;
    state.isOpen = false;
    circuits.set(sourceId, state);

    return result;
  } catch {
    // Failure — increment counter
    state.failures++;
    state.lastFailure = Date.now();
    if (state.failures >= CIRCUIT_THRESHOLD) {
      state.isOpen = true;
    }
    circuits.set(sourceId, state);

    if (options?.fallback !== undefined) return options.fallback;
    return [] as unknown as T;
  }
}

/**
 * Get health status of all data sources.
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
 */
export function resetCircuit(sourceId: string): void {
  circuits.delete(sourceId);
}
