import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchPowerOutages } from "@/lib/api/power-outage";

export const runtime = "nodejs";

/** GET /api/outages — US power outage data from ORNL ODIN */
export async function GET() {
  try {
    const outages = await cachedFetch("data:outages", () => fetchPowerOutages(30), 900);
    return NextResponse.json({ outages, total: outages.length, lastUpdated: new Date().toISOString() });
  } catch {
    return NextResponse.json({ outages: [], total: 0 }, { status: 500 });
  }
}
