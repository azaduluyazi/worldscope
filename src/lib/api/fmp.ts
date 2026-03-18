/**
 * Financial Modeling Prep — Company financials, stock screener
 * https://site.financialmodelingprep.com/developer/docs
 */

export interface FMPQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  marketCap: number;
  volume: number;
  exchange: string;
}

/** Fetch market gainers/losers for market pulse */
export async function fetchFMPMarketMovers(): Promise<{ gainers: FMPQuote[]; losers: FMPQuote[] }> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return { gainers: [], losers: [] };
  try {
    const [gainRes, loseRes] = await Promise.allSettled([
      fetch(`https://financialmodelingprep.com/api/v3/stock_market/gainers?apikey=${apiKey}`, { signal: AbortSignal.timeout(8000) }),
      fetch(`https://financialmodelingprep.com/api/v3/stock_market/losers?apikey=${apiKey}`, { signal: AbortSignal.timeout(8000) }),
    ]);

    const gainers = gainRes.status === "fulfilled" && gainRes.value.ok
      ? (await gainRes.value.json()).slice(0, 10) : [];
    const losers = loseRes.status === "fulfilled" && loseRes.value.ok
      ? (await loseRes.value.json()).slice(0, 10) : [];

    return { gainers, losers };
  } catch { return { gainers: [], losers: [] }; }
}
