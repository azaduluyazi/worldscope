/**
 * Finance MCP — Aggregated financial data from multiple sources.
 * Provides forex rates, stock quotes, and market summaries via a single endpoint.
 *
 * Source: guangxiangdebizi/FinanceMCP (509 stars)
 * Gap: Consolidates multiple finance queries into fewer API calls.
 * Uses public APIs underneath — no key required.
 */

import type { IntelItem } from "@/types/intel";

/**
 * Fetch major index summaries from public finance APIs.
 * Combines Yahoo Finance and other public endpoints.
 */
export async function fetchMajorIndices(): Promise<IntelItem[]> {
  const indices = [
    { symbol: "^GSPC", name: "S&P 500", region: "US" },
    { symbol: "^DJI", name: "Dow Jones", region: "US" },
    { symbol: "^IXIC", name: "NASDAQ", region: "US" },
    { symbol: "^FTSE", name: "FTSE 100", region: "UK" },
    { symbol: "^GDAXI", name: "DAX", region: "DE" },
    { symbol: "^N225", name: "Nikkei 225", region: "JP" },
    { symbol: "XU100.IS", name: "BIST 100", region: "TR" },
  ];

  const items: IntelItem[] = [];

  try {
    // Use Yahoo Finance v8 public endpoint for batch quotes
    const symbols = indices.map((i) => i.symbol).join(",");
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${encodeURIComponent(symbols)}&range=1d&interval=1h`,
      {
        signal: AbortSignal.timeout(8000),
        headers: {
          Accept: "application/json",
          "User-Agent": "WorldScope/1.0",
        },
      },
    );
    if (!res.ok) return [];

    const data = await res.json();

    // Yahoo Finance v8 now returns data keyed by symbol (no spark.result wrapper)
    for (const idx of indices) {
      const result = data[idx.symbol];
      if (!result?.close?.length) continue;

      const closes = result.close as number[];
      const price = closes[closes.length - 1];
      const prevClose = result.chartPreviousClose || result.previousClose || price;
      const change = price - prevClose;
      const changePct = prevClose ? (change / prevClose) * 100 : 0;
      const direction = change > 0 ? "📈" : change < 0 ? "📉" : "➡️";

      items.push({
        id: `idx-${idx.symbol}-${Date.now()}`,
        title: `${direction} ${idx.name}: ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        summary: `${idx.name} (${idx.region}) | ${price.toFixed(2)} | ${change > 0 ? "+" : ""}${changePct.toFixed(2)}% (${change > 0 ? "+" : ""}${change.toFixed(2)})`,
        url: `https://finance.yahoo.com/quote/${encodeURIComponent(idx.symbol)}`,
        source: "Market Indices",
        category: "finance",
        severity: Math.abs(changePct) > 3 ? "high" : Math.abs(changePct) > 1.5 ? "medium" : "info",
        publishedAt: new Date().toISOString(),
        countryCode: idx.region,
      });
    }
  } catch {
    // Fallback: return empty
  }

  return items;
}
