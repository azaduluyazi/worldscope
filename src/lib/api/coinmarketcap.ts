/**
 * CoinMarketCap — Most comprehensive crypto data
 * https://pro.coinmarketcap.com/
 */

export interface CMCQuote {
  id: number;
  name: string;
  symbol: string;
  price: number;
  percent_change_24h: number;
  percent_change_7d: number;
  market_cap: number;
  volume_24h: number;
}

export async function fetchCMCTop(limit = 20): Promise<CMCQuote[]> {
  const apiKey = process.env.CMC_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=${limit}&convert=USD`,
      { signal: AbortSignal.timeout(10000), headers: { "X-CMC_PRO_API_KEY": apiKey } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data || []).map((c: Record<string, unknown>): CMCQuote => {
      const q = (c.quote as Record<string, Record<string, number>>)?.USD || {};
      return {
        id: Number(c.id),
        name: String(c.name),
        symbol: String(c.symbol),
        price: q.price || 0,
        percent_change_24h: q.percent_change_24h || 0,
        percent_change_7d: q.percent_change_7d || 0,
        market_cap: q.market_cap || 0,
        volume_24h: q.volume_24h || 0,
      };
    });
  } catch { return []; }
}
