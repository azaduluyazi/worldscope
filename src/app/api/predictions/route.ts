import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchPredictionMarkets } from "@/lib/api/polymarket";

export const runtime = "nodejs";

export async function GET() {
  try {
    const markets = await cachedFetch(
      "predictions:polymarket",
      () => fetchPredictionMarkets(30),
      300
    );

    return NextResponse.json({
      markets,
      total: markets.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ markets: [], total: 0, lastUpdated: new Date().toISOString() });
  }
}
