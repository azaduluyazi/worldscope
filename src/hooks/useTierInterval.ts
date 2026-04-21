"use client";

import { useAccess } from "./useAccess";

/**
 * Tier-aware SWR refresh interval.
 *
 * Free users poll **10× slower** than the component's nominal base rate.
 * This is the single biggest knob we have to keep upstream API quotas
 * (Finnhub, OpenSky, AISStream, NASA FIRMS) from being drained by
 * anonymous dashboard viewers who rarely convert. Gaia (`global` tier)
 * subscribers get the fast refresh they paid for.
 *
 * Usage — replace `refreshInterval: 30_000` with `useTierInterval(30_000)`:
 *
 *   const interval = useTierInterval(30_000);
 *   const { data } = useSWR(key, fetcher, { refreshInterval: interval });
 *
 * Known trade-offs:
 * - Purely client-side — a malicious user can call the API directly at
 *   any rate. Backend rate-limiting (src/lib/ratelimit.ts) is the real
 *   defence layer; this hook is the cost-control layer.
 * - While `useAccess` is loading (first ~150ms after page mount) we
 *   treat the user as free, which is the safer default.
 */
export function useTierInterval(baseMs: number): number {
  const { access, loading } = useAccess();
  if (loading) return baseMs * 10;
  // Any paid tier gets the base rate; free tier gets 10× slower.
  return access.tier === "free" ? baseMs * 10 : baseMs;
}

/**
 * Variant that takes both a free-tier and pro-tier interval explicitly
 * (when a 10× factor is too coarse). Example:
 *
 *   const interval = useTierIntervalExplicit(60_000, 15_000);
 */
export function useTierIntervalExplicit(freeMs: number, proMs: number): number {
  const { access, loading } = useAccess();
  if (loading) return freeMs;
  return access.tier === "free" ? freeMs : proMs;
}
