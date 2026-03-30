import { NextResponse } from "next/server";
import { runSeeder, seedPublish } from "@/lib/seed/seed-utils";
import { TTL } from "@/lib/cache/redis";
import { fetchCryptoQuotes } from "@/lib/api/coingecko";
import { fetchStockQuote, fetchForexQuote } from "@/lib/api/alpha-vantage";
import { fetchFearGreedIndex } from "@/lib/api/fear-greed";
import type { MarketQuote } from "@/types/market";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runSeeder("seed-market", 30_000, async () => {
    const results: Record<string, number> = {};

    // Market quotes
    try {
      const [crypto, spy, gld, uso, eurusd] = await Promise.allSettled([
        fetchCryptoQuotes(["bitcoin", "ethereum"]),
        fetchStockQuote("SPY"),
        fetchStockQuote("GLD"),
        fetchStockQuote("USO"),
        fetchForexQuote("EUR", "USD"),
      ]);

      const quotes: MarketQuote[] = [];
      if (crypto.status === "fulfilled") quotes.push(...crypto.value);
      if (spy.status === "fulfilled" && spy.value) {
        quotes.push({ ...spy.value, symbol: "S&P 500", name: "S&P 500" });
      }
      if (gld.status === "fulfilled" && gld.value) {
        quotes.push({ ...gld.value, symbol: "GOLD", name: "Gold" });
      }
      if (uso.status === "fulfilled" && uso.value) {
        quotes.push({ ...uso.value, symbol: "OIL", name: "WTI Oil" });
      }
      if (eurusd.status === "fulfilled" && eurusd.value) quotes.push(eurusd.value);

      await seedPublish("seed:market:quotes", quotes, TTL.FAST, "seed-market");
      results.quotes = quotes.length;
    } catch {
      results.quotes = 0;
    }

    // Fear & Greed Index
    try {
      const fearGreed = await fetchFearGreedIndex();
      await seedPublish("seed:market:fear-greed", fearGreed, TTL.MEDIUM, "seed-market");
      results.fearGreed = 1;
    } catch {
      results.fearGreed = 0;
    }

    // Crypto extended
    try {
      const crypto = await fetchCryptoQuotes([
        "bitcoin", "ethereum", "solana", "cardano", "ripple",
        "dogecoin", "polkadot", "chainlink", "avalanche-2", "polygon",
      ]);
      await seedPublish("seed:market:crypto", crypto, TTL.FAST, "seed-market");
      results.crypto = crypto.length;
    } catch {
      results.crypto = 0;
    }

    return results;
  });

  return NextResponse.json(result);
}
