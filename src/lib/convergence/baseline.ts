import type { Category } from "@/types/intel";

// ═══════════════════════════════════════════════════════════════════
//  Baseline & Noise Floor (Hybrid Redis + Supabase)
// ═══════════════════════════════════════════════════════════════════
//
//  PROBLEM v1 had:
//  ---------------
//  The convergence detector treats every (category-pair × region ×
//  time-window) hit as meaningful. But some hits are STATISTICAL
//  NORMAL — e.g. tech+finance signals during NY market open are
//  baseline noise, not convergence.
//
//  SOLUTION:
//  ---------
//  Maintain a rolling baseline: how often does this (category-pair,
//  region, hour-of-day, day-of-week) co-occur historically? Then
//  measure today's rate against baseline → "surprise factor".
//
//  The surprise factor is fed BACK into the Bayesian scorer as an
//  evidence multiplier. Boring co-occurrences score lower; anomalous
//  ones score higher.
//
//  STORAGE STRATEGY (decision: hybrid C):
//  --------------------------------------
//  • Hot path: Upstash Redis  → rolling 30-day counters in-memory
//  • Cold path: Supabase      → long-term archive for backtesting
//
//  Both backends are abstracted behind the BaselineStore interface so
//  the math doesn't depend on infrastructure.
//
// ═══════════════════════════════════════════════════════════════════

export interface BaselineKey {
  categoryA: Category;
  categoryB: Category;
  region: string;       // GLOBAL, NA, EU, AS, ME, AF, SA
  hourOfDay: number;    // 0-23 (UTC)
  dayOfWeek: number;    // 0-6
}

export interface BaselineRecord extends BaselineKey {
  /** Number of co-occurrences observed in this slot over the lookback window */
  count: number;
  /** Normalized rate (count / window-days) */
  ratePerDay: number;
  /** When this record was last updated */
  updatedAt: string;
}

export interface BaselineStore {
  /** Get the baseline record for a specific key, or null if none */
  get(key: BaselineKey): Promise<BaselineRecord | null>;
  /** Increment the counter for a key by 1 (atomic) */
  increment(key: BaselineKey): Promise<void>;
  /** Bulk fetch many keys (for scoring multiple convergences efficiently) */
  getMany(keys: BaselineKey[]): Promise<Map<string, BaselineRecord>>;
}

// ── Key serialization ─────────────────────────────────────────────

export function serializeKey(key: BaselineKey): string {
  // Order categories alphabetically so (A,B) and (B,A) collapse
  const [a, b] = [key.categoryA, key.categoryB].sort();
  return `${a}|${b}|${key.region}|${key.hourOfDay}|${key.dayOfWeek}`;
}

export function deserializeKey(serialized: string): BaselineKey {
  const [categoryA, categoryB, region, hourOfDay, dayOfWeek] = serialized.split("|");
  return {
    categoryA: categoryA as Category,
    categoryB: categoryB as Category,
    region,
    hourOfDay: Number(hourOfDay),
    dayOfWeek: Number(dayOfWeek),
  };
}

// ── Surprise computation ──────────────────────────────────────────

const MIN_BASELINE_COUNT = 5; // need at least 5 historical hits to trust the baseline
const NEUTRAL_SURPRISE = 1.0; // multiplier when we don't trust the baseline yet

/**
 * Compute the surprise factor for a current observed rate vs baseline.
 *
 * surprise = log2(observed_rate / baseline_rate + 1)
 *
 * Examples (with neutral 1.0 add):
 *   - observed = baseline   → surprise = log2(2)   = 1.0   (normal)
 *   - observed = 4x baseline → surprise = log2(5)   = 2.32  (notable)
 *   - observed = 10x baseline → surprise = log2(11) = 3.46 (extreme)
 *
 * Returns a multiplier in [1.0, 4.0] (clamped) that the Bayesian
 * scorer can apply to boost anomalous co-occurrences.
 */
export function surpriseMultiplier(
  observedRatePerDay: number,
  baselineRatePerDay: number,
  baselineCount: number
): number {
  if (baselineCount < MIN_BASELINE_COUNT || baselineRatePerDay <= 0) {
    return NEUTRAL_SURPRISE;
  }
  const ratio = observedRatePerDay / baselineRatePerDay;
  const surprise = Math.log2(ratio + 1);
  return Math.max(1.0, Math.min(4.0, surprise));
}

// ── Concrete Redis-backed implementation (sketch) ─────────────────
//
// We expose the interface and a Redis-backed store. The Redis client
// is injected so this module doesn't import upstash directly (keeps
// the convergence package free of infra dependencies).

export interface RedisLike {
  get(key: string): Promise<string | null>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
}

const REDIS_PREFIX = "ws:baseline:";
const REDIS_TTL_SECONDS = 35 * 24 * 60 * 60; // 35 days rolling window

export class RedisBaselineStore implements BaselineStore {
  constructor(
    private readonly redis: RedisLike,
    private readonly windowDays: number = 30
  ) {}

  async get(key: BaselineKey): Promise<BaselineRecord | null> {
    const k = REDIS_PREFIX + serializeKey(key);
    const raw = await this.redis.get(k);
    if (!raw) return null;
    const count = Number(raw);
    return {
      ...key,
      count,
      ratePerDay: count / this.windowDays,
      updatedAt: new Date().toISOString(),
    };
  }

  async increment(key: BaselineKey): Promise<void> {
    const k = REDIS_PREFIX + serializeKey(key);
    await this.redis.incr(k);
    await this.redis.expire(k, REDIS_TTL_SECONDS);
  }

  async getMany(keys: BaselineKey[]): Promise<Map<string, BaselineRecord>> {
    const out = new Map<string, BaselineRecord>();
    // For now: sequential. TODO: pipeline once we wire to upstash mget
    for (const key of keys) {
      const rec = await this.get(key);
      if (rec) out.set(serializeKey(key), rec);
    }
    return out;
  }
}

// ── Helper: derive a BaselineKey from a convergence ──────────────

export function keyFromCategories(
  categories: Category[],
  region: string,
  timestamp: Date = new Date()
): BaselineKey[] {
  // Generate one key per unordered category pair
  const keys: BaselineKey[] = [];
  for (let i = 0; i < categories.length; i++) {
    for (let j = i + 1; j < categories.length; j++) {
      keys.push({
        categoryA: categories[i],
        categoryB: categories[j],
        region,
        hourOfDay: timestamp.getUTCHours(),
        dayOfWeek: timestamp.getUTCDay(),
      });
    }
  }
  return keys;
}
