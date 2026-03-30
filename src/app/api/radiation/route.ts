import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchSafecastReadings } from "@/lib/api/radiation";
import { seedRead } from "@/lib/seed/seed-utils";

export const runtime = "nodejs";

/** GET /api/radiation — Safecast global radiation readings */
export async function GET() {
  try {
    // Seed-first: try pre-populated cache
    const seeded = await seedRead<unknown[]>("seed:radiation:readings");
    if (seeded) {
      return NextResponse.json({ readings: seeded, total: seeded.length, lastUpdated: new Date().toISOString(), fromSeed: true });
    }

    const readings = await cachedFetch("data:radiation", fetchSafecastReadings, 1800);
    return NextResponse.json({ readings, total: readings.length, lastUpdated: new Date().toISOString() });
  } catch {
    return NextResponse.json({ readings: [], total: 0 }, { status: 500 });
  }
}
