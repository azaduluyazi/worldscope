import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchPredictionMarkets } from "@/lib/api/polymarket";

export const runtime = "nodejs";

/** GET /api/predictions — Active prediction markets from Polymarket */
export async function GET() {
  try {
    const markets = await cachedFetch("data:predictions", () => fetchPredictionMarkets(20), 300);
    return NextResponse.json({ markets, total: markets.length, lastUpdated: new Date().toISOString() });
  } catch {
    return NextResponse.json({ markets: [], total: 0 }, { status: 500 });
  }
}
