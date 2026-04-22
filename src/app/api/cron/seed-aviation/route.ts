import { NextResponse } from "next/server";
import { runSeeder, seedPublish } from "@/lib/seed/seed-utils";
import { TTL } from "@/lib/cache/redis";
import { fetchGlobalAircraft } from "@/lib/api/opensky";
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

  const result = await runSeeder("seed-aviation", 15_000, async () => {
    const results: Record<string, number> = {};

    try {
      const aircraft = await fetchGlobalAircraft();
      await seedPublish(SEED_KEYS.flights.opensky, aircraft, TTL.REALTIME, "seed-aviation");
      results.opensky = aircraft.length;
    } catch (err) {
      console.error("[cron/seed-aviation]", err);
      results.opensky = 0;
    }

    return results;
  });

  return NextResponse.json(result);
}
