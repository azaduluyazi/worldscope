import type { MarketQuote } from "@/types/market";
import { cachedFetch, TTL } from "@/lib/cache/redis";

/**
 * ExchangeRate API — Free forex rates (no API key required).
 * Returns USD-based exchange rates for tracked currency pairs.
 * Docs: https://www.exchangerate-api.com/docs/free
 */

const API = "https://api.exchangerate-api.com/v4/latest/USD";

const TRACKED_PAIRS = [
  "EUR",
  "GBP",
  "JPY",
  "TRY",
  "CNY",
  "CHF",
  "AUD",
  "CAD",
  "INR",
  "BRL",
];

export async function fetchExchangeRates(): Promise<MarketQuote[]> {
  return cachedFetch<MarketQuote[]>(
    "exchangerate:usd",
    async () => {
      try {
        const res = await fetch(API, {
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return [];

        const json = await res.json();
        const rates: Record<string, number> = json.rates || {};
        const updatedAt = json.date
          ? new Date(json.date).toISOString()
          : new Date().toISOString();

        return TRACKED_PAIRS.filter((c) => rates[c]).map((c) => ({
          symbol: `USD/${c}`,
          name: `US Dollar / ${c}`,
          price: rates[c],
          change: 0, // Free tier has no change data
          changePct: 0,
          currency: c,
          updatedAt,
        }));
      } catch {
        return [];
      }
    },
    TTL.MARKET
  );
}
