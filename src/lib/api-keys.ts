/**
 * Developer API Key Management
 *
 * Manual approval flow:
 * 1. Developer submits application (stored as "pending" in Supabase)
 * 2. Admin reviews via /admin/api-keys
 * 3. On approval: key generated, hashed, emailed once to developer
 * 4. Raw key is NEVER stored — only SHA-256 hash
 * 5. Validation: hash incoming key, match against DB + Redis cache
 */

import crypto from "crypto";
import { redis, TTL } from "./cache/redis";
import { createServerClient } from "./db/supabase";

/* ─── Types ─── */

export interface ApiKeyRecord {
  id: string;
  email: string;
  name: string;
  purpose: string;
  website?: string;
  key_hash: string;
  key_prefix: string;
  status: "pending" | "approved" | "denied" | "revoked";
  rate_limit: number;
  created_at: string;
  approved_at?: string;
  last_used_at?: string;
  request_count: number;
}

export interface GeneratedKey {
  key: string;
  hash: string;
  prefix: string;
}

/* ─── Key Generation ─── */

const KEY_PREFIX = "ws_live_";

/**
 * Generate a new API key.
 * Format: ws_live_ + 48 hex chars (24 random bytes)
 * Returns the raw key (shown once), its SHA-256 hash, and a display prefix.
 */
export function generateApiKey(): GeneratedKey {
  const randomPart = crypto.randomBytes(24).toString("hex");
  const key = `${KEY_PREFIX}${randomPart}`;
  const hash = hashApiKey(key);
  const prefix = key.slice(0, 12);

  return { key, hash, prefix };
}

/**
 * SHA-256 hash an API key for secure storage.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/* ─── Validation ─── */

const CACHE_PREFIX = "apikey:";

/**
 * Validate an API key.
 * 1. Hash the incoming key
 * 2. Check Redis cache (5 min TTL)
 * 3. Fall back to Supabase lookup
 * 4. Update last_used_at and request_count
 * Returns the key record if valid, null otherwise.
 */
export async function validateApiKey(
  key: string
): Promise<ApiKeyRecord | null> {
  if (!key || !key.startsWith(KEY_PREFIX)) return null;

  const hash = hashApiKey(key);
  const cacheKey = `${CACHE_PREFIX}${hash}`;

  // L1: Redis cache
  const cached = await redis.get<ApiKeyRecord>(cacheKey);
  if (cached) {
    // Fire-and-forget usage tracking
    trackUsage(cached.id).catch(() => {});
    return cached;
  }

  // L2: Supabase lookup
  const db = createServerClient();
  const { data, error } = await db
    .from("api_keys")
    .select("*")
    .eq("key_hash", hash)
    .eq("status", "approved")
    .single();

  if (error || !data) return null;

  const record = data as ApiKeyRecord;

  // Cache valid key for 5 minutes
  await redis.set(cacheKey, record, { ex: TTL.MEDIUM });

  // Fire-and-forget usage tracking
  trackUsage(record.id).catch(() => {});

  return record;
}

/**
 * Update usage stats for a key (non-blocking).
 */
async function trackUsage(keyId: string): Promise<void> {
  const db = createServerClient();
  await db.rpc("increment_api_key_usage", { key_id: keyId });
}

/* ─── Rate Limiting (per-key) ─── */

/**
 * Check if a key has exceeded its rate limit.
 * Uses Redis sliding window counter per key.
 * Returns { allowed: boolean, remaining: number }
 */
export async function checkKeyRateLimit(
  keyId: string,
  limit: number
): Promise<{ allowed: boolean; remaining: number }> {
  const windowKey = `rl:apikey:${keyId}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - 3600; // 1 hour window

  // Remove old entries outside the window
  await redis.zremrangebyscore(windowKey, 0, windowStart);

  // Count current requests in window
  const count = await redis.zcard(windowKey);

  if (count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  // Add this request
  await redis.zadd(windowKey, { score: now, member: `${now}:${crypto.randomBytes(4).toString("hex")}` });
  await redis.expire(windowKey, 3600);

  return { allowed: true, remaining: limit - count - 1 };
}

/* ─── Admin Helpers ─── */

/**
 * Invalidate cached key (after revocation).
 */
export async function invalidateKeyCache(keyHash: string): Promise<void> {
  await redis.del(`${CACHE_PREFIX}${keyHash}`);
}
