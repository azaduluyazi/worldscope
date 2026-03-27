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

/** Search for stock symbols */
export async function fetchSymbolSearch(query: string): Promise<Array<{
  symbol: string;
  description: string;
  type: string;
}>> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `${FINNHUB_BASE}/search?q=${encodeURIComponent(query)}&token=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.result || []).slice(0, 10).map((r: Record<string, string>) => ({
      symbol: r.symbol || "",
      description: r.description || "",
      type: r.type || "",
    }));
  } catch { return []; }
}

/** Fetch company profile */
export async function fetchCompanyProfile(symbol: string): Promise<{
  name: string; ticker: string; exchange: string; industry: string;
  marketCap: number; logo: string; weburl: string; country: string;
} | null> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `${FINNHUB_BASE}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const d = await res.json();
    if (!d.name) return null;
    return {
      name: d.name, ticker: d.ticker, exchange: d.exchange, industry: d.finnhubIndustry,
      marketCap: d.marketCapitalization, logo: d.logo, weburl: d.weburl, country: d.country,
    };
  } catch { return null; }
}

/** Fetch analyst price target */
export async function fetchPriceTarget(symbol: string): Promise<{
  targetHigh: number; targetLow: number; targetMean: number; targetMedian: number;
} | null> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `${FINNHUB_BASE}/stock/price-target?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const d = await res.json();
    return { targetHigh: d.targetHigh, targetLow: d.targetLow, targetMean: d.targetMean, targetMedian: d.targetMedian };
  } catch { return null; }
}

/** Fetch analyst recommendations */
export async function fetchRecommendation(symbol: string): Promise<Array<{
  period: string; buy: number; hold: number; sell: number; strongBuy: number; strongSell: number;
}>> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `${FINNHUB_BASE}/stock/recommendation?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.slice(0, 4) : [];
  } catch { return []; }
}
