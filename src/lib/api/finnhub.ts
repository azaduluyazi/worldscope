/**
 * Finnhub Stock API — Free tier: 60 req/min
 * https://finnhub.io/docs/api
 */

export interface FinnhubQuote {
  symbol: string;
  current: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

const FINNHUB_BASE = "https://finnhub.io/api/v1";

/** Fetch stock quote from Finnhub */
export async function fetchFinnhubQuote(symbol: string): Promise<FinnhubQuote | null> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(
      `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.c === 0) return null;

    return {
      symbol,
      current: data.c,
      change: data.d,
      percentChange: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
      timestamp: data.t,
    };
  } catch {
    return null;
  }
}

/** Fetch market news from Finnhub */
export async function fetchFinnhubNews(category = "general"): Promise<Array<{
  headline: string;
  source: string;
  url: string;
  datetime: number;
  summary: string;
}>> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(
      `${FINNHUB_BASE}/news?category=${category}&token=${apiKey}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data) ? data.slice(0, 20) : [];
  } catch {
    return [];
  }
}
