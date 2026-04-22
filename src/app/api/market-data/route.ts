import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchAllMarketData } from "@/lib/api/yahoo-finance";

export const runtime = "nodejs";
export const maxDuration = 30;

/** GET /api/market-data — Yahoo Finance stocks, commodities, sector ETFs */
export async function GET() {
  try {
    const data = await cachedFetch("market:yahoo", fetchAllMarketData, 120);
    return NextResponse.json({ ...data, lastUpdated: new Date().toISOString() });
  } catch (err) {
    console.error("[market-data]", err);
    return NextResponse.json({ indices: [], commodities: [], sectors: [] }, { status: 500 });
  }
}
