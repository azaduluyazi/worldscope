import { NextResponse } from "next/server";
import { runSeeder, seedPublish } from "@/lib/seed/seed-utils";
import { TTL } from "@/lib/cache/redis";
import { fetchAllCyberThreats } from "@/lib/api/cyber-threats";

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

  const result = await runSeeder("seed-cyber", 30_000, async () => {
    const results: Record<string, number> = {};

    try {
      const threats = await fetchAllCyberThreats();
      await seedPublish("seed:cyber:threats", threats, TTL.SLOW, "seed-cyber");
      results.threats = threats.length;
    } catch {
      results.threats = 0;
    }

    return results;
  });

  return NextResponse.json(result);
}
