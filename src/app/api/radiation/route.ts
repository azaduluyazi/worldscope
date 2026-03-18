import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchSafecastReadings } from "@/lib/api/radiation";

export const runtime = "nodejs";

/** GET /api/radiation — Safecast global radiation readings */
export async function GET() {
  try {
    const readings = await cachedFetch("data:radiation", fetchSafecastReadings, 1800);
    return NextResponse.json({ readings, total: readings.length, lastUpdated: new Date().toISOString() });
  } catch {
    return NextResponse.json({ readings: [], total: 0 }, { status: 500 });
  }
}
