import { NextResponse } from "next/server";
import { cachedFetch, TTL } from "@/lib/cache/redis";
import { fetchCryptoQuotes } from "@/lib/api/coingecko";
import { fetchStockQuote, fetchForexQuote } from "@/lib/api/alpha-vantage";
import type { MarketQuote } from "@/types/market";

export const runtime = "nodejs";

export async function GET() {
  try {
    const quotes = await cachedFetch<MarketQuote[]>(
      "market:quotes:mvp",
      async () => {
        const [crypto, spy, gld, uso, eurusd] = await Promise.allSettled([
          fetchCryptoQuotes(["bitcoin", "ethereum"]),
          fetchStockQuote("SPY"),
          fetchStockQuote("GLD"),
          fetchStockQuote("USO"),
          fetchForexQuote("EUR", "USD"),
        ]);

        const results: MarketQuote[] = [];

        if (crypto.status === "fulfilled") results.push(...crypto.value);
        if (spy.status === "fulfilled" && spy.value) {
          results.push({ ...spy.value, symbol: "S&P 500", name: "S&P 500" });
        }
        if (gld.status === "fulfilled" && gld.value) {
          results.push({ ...gld.value, symbol: "GOLD", name: "Gold" });
        }
        if (uso.status === "fulfilled" && uso.value) {
          results.push({ ...uso.value, symbol: "OIL", name: "WTI Oil" });
        }
        if (eurusd.status === "fulfilled" && eurusd.value) results.push(eurusd.value);

        return results;
      },
      TTL.MARKET
    );

    return NextResponse.json({
      quotes,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ quotes: [], lastUpdated: new Date().toISOString() }, { status: 500 });
  }
}
