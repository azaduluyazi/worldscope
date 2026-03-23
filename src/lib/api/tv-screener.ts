/**
 * TradingView Screener — Market screening data (top gainers, losers, volume).
 * Provides "what's moving" data that individual price APIs don't offer.
 *
 * Source: deepentropy/tvscreener (810 stars)
 * Gap: Existing sources give individual prices but no screening/ranking.
 * This adds "Top Gainers", "Top Losers", "Most Active" to FinScope.
 */

import type { IntelItem } from "@/types/intel";

const TV_SCREENER_API = "https://scanner.tradingview.com";

interface ScreenerResult {
  s: string; // symbol
  d: (string | number | null)[]; // data columns
}

interface ScreenerResponse {
  data: ScreenerResult[];
  totalCount: number;
}

/**
 * Fetch market screener data from TradingView.
 */
async function fetchScreener(
  market: "america" | "forex" | "crypto",
  sortBy: string,
  sortOrder: "asc" | "desc" = "desc",
  limit = 10,
): Promise<ScreenerResponse | null> {
  try {
    const columns = [
      "name", "close", "change", "change_abs", "volume",
      "market_cap_basic", "description", "type", "subtype", "currency",
    ];

    const body = {
      columns,
      filter: [{ left: "is_primary", operation: "equal", right: true }],
      options: { lang: "en" },
      range: [0, limit],
      sort: { sortBy, sortOrder },
      markets: [market],
    };

    const res = await fetch(`${TV_SCREENER_API}/${market}/scan`, {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Parse screener results into structured data.
 */
function parseResults(data: ScreenerResponse | null): Array<{
  symbol: string;
  name: string;
  price: number;
  change: number;
  changeAbs: number;
  volume: number;
}> {
  if (!data?.data) return [];
  return data.data.map((r) => ({
    symbol: r.s?.replace(":", "/") || "",
    name: String(r.d[0] || ""),
    price: Number(r.d[1] || 0),
    change: Number(r.d[2] || 0),
    changeAbs: Number(r.d[3] || 0),
    volume: Number(r.d[4] || 0),
  }));
}

/**
 * Fetch market movers as intel items.
 */
export async function fetchMarketMoversIntel(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];

  // Top gainers
  try {
    const gainers = parseResults(await fetchScreener("america", "change", "desc", 5));
    if (gainers.length) {
      const list = gainers.map((g) => `${g.symbol} +${g.change.toFixed(1)}%`).join(", ");
      items.push({
        id: `tv-gainers-${Date.now()}`,
        title: `📈 Top Gainers: ${gainers[0].symbol} +${gainers[0].change.toFixed(1)}%`,
        summary: `US Market Top Gainers: ${list}`,
        url: "https://www.tradingview.com/screener/",
        source: "TV Screener",
        category: "finance",
        severity: gainers[0].change > 10 ? "medium" : "info",
        publishedAt: new Date().toISOString(),
      });
    }
  } catch { /* skip */ }

  // Top losers
  try {
    const losers = parseResults(await fetchScreener("america", "change", "asc", 5));
    if (losers.length) {
      const list = losers.map((l) => `${l.symbol} ${l.change.toFixed(1)}%`).join(", ");
      items.push({
        id: `tv-losers-${Date.now()}`,
        title: `📉 Top Losers: ${losers[0].symbol} ${losers[0].change.toFixed(1)}%`,
        summary: `US Market Top Losers: ${list}`,
        url: "https://www.tradingview.com/screener/",
        source: "TV Screener",
        category: "finance",
        severity: losers[0].change < -10 ? "medium" : "info",
        publishedAt: new Date().toISOString(),
      });
    }
  } catch { /* skip */ }

  // Crypto movers
  try {
    const crypto = parseResults(await fetchScreener("crypto", "change", "desc", 5));
    if (crypto.length) {
      const list = crypto.map((c) => `${c.name} +${c.change.toFixed(1)}%`).join(", ");
      items.push({
        id: `tv-crypto-movers-${Date.now()}`,
        title: `🪙 Crypto Movers: ${crypto[0].name} +${crypto[0].change.toFixed(1)}%`,
        summary: `Top Crypto Movers: ${list}`,
        url: "https://www.tradingview.com/screener/",
        source: "TV Screener",
        category: "finance",
        severity: "info",
        publishedAt: new Date().toISOString(),
      });
    }
  } catch { /* skip */ }

  return items;
}
