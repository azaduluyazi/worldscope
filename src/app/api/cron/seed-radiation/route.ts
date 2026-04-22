import { NextResponse } from "next/server";
import { runSeeder, seedPublish } from "@/lib/seed/seed-utils";
import { TTL } from "@/lib/cache/redis";
import { fetchSafecastReadings } from "@/lib/api/radiation";
import { SEED_KEYS } from "@/lib/cache/keys";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runSeeder("seed-radiation", 30_000, async () => {
    const results: Record<string, number> = {};

    try {
      const readings = await fetchSafecastReadings();
      await seedPublish(SEED_KEYS.radiation.readings, readings, TTL.SLOW, "seed-radiation");
      results.readings = readings.length;
    } catch (err) {
      console.error("[cron/seed-radiation]", err);
      results.readings = 0;
    }

    return results;
  });

  return NextResponse.json(result);
}
