import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchFREDData } from "@/lib/api/fred";
import { seedRead } from "@/lib/seed/seed-utils";
import { SEED_KEYS } from "@/lib/cache/keys";

export const runtime = "nodejs";

/** GET /api/economic — FRED Federal Reserve economic indicators */
export async function GET() {
  try {
    // Seed-first: try pre-populated cache
    const seeded = await seedRead<unknown[]>(SEED_KEYS.economic.fred);
    if (seeded) {
      return NextResponse.json({ indicators: seeded, total: seeded.length, lastUpdated: new Date().toISOString(), fromSeed: true });
    }

    const data = await cachedFetch("data:fred", fetchFREDData, 3600);
    return NextResponse.json({ indicators: data, total: data.length, lastUpdated: new Date().toISOString() });
  } catch (err) {
    console.error("[economic]", err);
    return NextResponse.json({ indicators: [], total: 0 }, { status: 500 });
  }
}
