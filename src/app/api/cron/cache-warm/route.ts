import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/cache/redis";
import { SEED_KEYS } from "@/lib/cache/keys";

export const dynamic = "force-dynamic";

const CRITICAL_SEED_KEYS = [
  SEED_KEYS.market.quotes,
  SEED_KEYS.market.fearGreed,
  SEED_KEYS.economic.fred,
  SEED_KEYS.cyber.threats,
  SEED_KEYS.natural.earthquakes,
  SEED_KEYS.conflict.acled,
  SEED_KEYS.conflict.gdelt,
];

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) return false;

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Array<{ key: string; exists: boolean }> = [];

  for (const key of CRITICAL_SEED_KEYS) {
    const exists = await redis.exists(key);
    results.push({ key, exists: exists === 1 });
  }

  const missing = results.filter(r => !r.exists);
  const healthy = results.filter(r => r.exists);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    total: CRITICAL_SEED_KEYS.length,
    healthy: healthy.length,
    missing: missing.length,
    missingKeys: missing.map(r => r.key),
    allKeys: results,
  });
}
