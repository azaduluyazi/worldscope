import { NextResponse } from "next/server";
import { runSeeder, seedPublish } from "@/lib/seed/seed-utils";
import { TTL } from "@/lib/cache/redis";
import { fetchAcledEvents } from "@/lib/api/acled";
import { fetchGdeltArticles } from "@/lib/api/gdelt";

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

  const result = await runSeeder("seed-conflict", 30_000, async () => {
    const results: Record<string, number> = {};

    // ACLED conflict events
    try {
      const acled = await fetchAcledEvents(100);
      await seedPublish("seed:conflict:acled", acled, TTL.SLOW, "seed-conflict");
      results.acled = acled.length;
    } catch {
      results.acled = 0;
    }

    // GDELT articles
    try {
      const gdelt = await fetchGdeltArticles("conflict OR war OR attack");
      await seedPublish("seed:conflict:gdelt", gdelt, TTL.SLOW, "seed-conflict");
      results.gdelt = gdelt.length;
    } catch {
      results.gdelt = 0;
    }

    return results;
  });

  return NextResponse.json(result);
}
