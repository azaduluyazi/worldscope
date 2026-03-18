import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchFREDData } from "@/lib/api/fred";

export const runtime = "nodejs";

/** GET /api/economic — FRED Federal Reserve economic indicators */
export async function GET() {
  try {
    const data = await cachedFetch("data:fred", fetchFREDData, 3600);
    return NextResponse.json({ indicators: data, total: data.length, lastUpdated: new Date().toISOString() });
  } catch {
    return NextResponse.json({ indicators: [], total: 0 }, { status: 500 });
  }
}
