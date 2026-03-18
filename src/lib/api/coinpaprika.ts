/**
 * CoinPaprika — Crypto market data, no key required.
 * https://api.coinpaprika.com/
 */

export interface CoinTicker {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  price_usd: number;
  percent_change_24h: number;
  percent_change_7d: number;
  market_cap_usd: number;
  volume_24h_usd: number;
}

/** Fetch top crypto tickers */
export async function fetchCoinPaprikaTickers(limit = 20): Promise<CoinTicker[]> {
  try {
    const res = await fetch("https://api.coinpaprika.com/v1/tickers?limit=" + limit, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((c: Record<string, unknown>): CoinTicker => ({
      id: String(c.id),
      name: String(c.name),
      symbol: String(c.symbol),
      rank: Number(c.rank),
      price_usd: Number((c.quotes as Record<string, Record<string, number>>)?.USD?.price || 0),
      percent_change_24h: Number((c.quotes as Record<string, Record<string, number>>)?.USD?.percent_change_24h || 0),
      percent_change_7d: Number((c.quotes as Record<string, Record<string, number>>)?.USD?.percent_change_7d || 0),
      market_cap_usd: Number((c.quotes as Record<string, Record<string, number>>)?.USD?.market_cap || 0),
      volume_24h_usd: Number((c.quotes as Record<string, Record<string, number>>)?.USD?.volume_24h || 0),
    }));
  } catch {
    return [];
  }
}
