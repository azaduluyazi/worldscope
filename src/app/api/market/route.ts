import { NextResponse } from "next/server";
import { cachedFetch, TTL } from "@/lib/cache/redis";
import { fetchCryptoQuotes } from "@/lib/api/coingecko";
import { fetchStockQuote, fetchForexQuote } from "@/lib/api/alpha-vantage";
import { fetchFearGreedIndex } from "@/lib/api/fear-greed";
import { seedRead } from "@/lib/seed/seed-utils";
import type { MarketQuote } from "@/types/market";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Seed-first: try pre-populated cache
    const [seededQuotes, seededFearGreed, _seededCrypto] = await Promise.all([
      seedRead<MarketQuote[]>("seed:market:quotes"),
      seedRead<unknown>("seed:market:fear-greed"),
      seedRead<MarketQuote[]>("seed:market:crypto"),
    ]);
    if (seededQuotes && seededFearGreed) {
      return NextResponse.json({
        quotes: seededQuotes,
        fearGreed: seededFearGreed,
        lastUpdated: new Date().toISOString(),
        fromSeed: true,
      });
    }

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

    // Fear & Greed Index (separate cache, longer TTL)
    const fearGreed = await cachedFetch(
      "market:fear-greed",
      async () => fetchFearGreedIndex(),
      TTL.THREAT
    );

    return NextResponse.json({
      quotes,
      fearGreed,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ quotes: [], lastUpdated: new Date().toISOString() }, { status: 500 });
  }
}
