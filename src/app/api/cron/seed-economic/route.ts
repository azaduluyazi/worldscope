import { NextResponse } from "next/server";
import { runSeeder, seedPublish } from "@/lib/seed/seed-utils";
import { TTL } from "@/lib/cache/redis";
import { fetchFREDData } from "@/lib/api/fred";
import { fetchBisPolicyRates } from "@/lib/api/bis";
import { fetchWorldBankIndicator } from "@/lib/api/world-bank";
import { SEED_KEYS } from "@/lib/cache/keys";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

  const result = await runSeeder("seed-economic", 60_000, async () => {
    const results: Record<string, number> = {};

    // FRED indicators
    try {
      const fred = await fetchFREDData();
      await seedPublish(SEED_KEYS.economic.fred, fred, TTL.STATIC, "seed-economic");
      results.fred = Array.isArray(fred) ? fred.length : 1;
    } catch (err) {
      console.error("[cron/seed-economic]", err);
      results.fred = 0;
    }

    // BIS policy rates
    try {
      const bis = await fetchBisPolicyRates();
      await seedPublish(SEED_KEYS.economic.bis, bis, TTL.STATIC, "seed-economic");
      results.bis = bis.length;
    } catch (err) {
      console.error("[cron/seed-economic]", err);
      results.bis = 0;
    }

    // World Bank — GDP growth indicator
    try {
      const wb = await fetchWorldBankIndicator("NY.GDP.MKTP.KD.ZG");
      await seedPublish(SEED_KEYS.economic.wb, wb, TTL.STATIC, "seed-economic");
      results.wb = wb.length;
    } catch (err) {
      console.error("[cron/seed-economic]", err);
      results.wb = 0;
    }

    return results;
  });

  return NextResponse.json(result);
}
