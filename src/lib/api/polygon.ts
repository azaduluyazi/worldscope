/**
 * Polygon.io — Historical stock market data
 * https://polygon.io/
 */

export interface PolygonTicker {
  symbol: string;
  name: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  change: number;
  changePercent: number;
}

export async function fetchPolygonSnapshot(): Promise<PolygonTicker[]> {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?apiKey=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.tickers || []).slice(0, 20).map((t: Record<string, unknown>): PolygonTicker => {
      const day = t.day as Record<string, number> | undefined;
      return {
        symbol: String(t.ticker || ""),
        name: String(t.ticker || ""),
        close: day?.c || 0,
        open: day?.o || 0,
        high: day?.h || 0,
        low: day?.l || 0,
        volume: day?.v || 0,
        change: (day?.c || 0) - (day?.o || 0),
        changePercent: day?.o ? (((day.c || 0) - day.o) / day.o) * 100 : 0,
      };
    });
  } catch { return []; }
}
