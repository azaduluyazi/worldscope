/**
 * Dollar-Toman API — Iranian Rial/Toman exchange rates.
 * Tracks USD, EUR, GBP, gold prices in Iranian market.
 * Free, no API key required.
 */

import type { IntelItem } from "@/types/intel";

interface TomanPrice {
  slug: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  updatedAt: string;
}

/**
 * Fetch Iranian market exchange rates.
 */
export async function fetchDollarTomanRates(): Promise<TomanPrice[]> {
  try {
    const res = await fetch("https://api.accessban.com/v1/market/currency/list", {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const items: Array<Record<string, unknown>> = data?.data || [];

    return items.slice(0, 20).map((item) => ({
      slug: String(item.slug || ""),
      name: String(item.name || ""),
      price: Number(item.price || 0),
      change: Number(item.change || 0),
      changePercent: Number(item.changePercent || 0),
      updatedAt: String(item.updatedAt || new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch as intel items for the feed.
 */
export async function fetchDollarTomanIntel(): Promise<IntelItem[]> {
  try {
    const rates = await fetchDollarTomanRates();
    if (!rates.length) return [];

    return rates.slice(0, 8).map((r): IntelItem => {
      const direction = r.change > 0 ? "📈" : r.change < 0 ? "📉" : "➡️";
      const severity = Math.abs(r.changePercent) > 5 ? "high" : Math.abs(r.changePercent) > 2 ? "medium" : "info";

      return {
        id: `toman-${r.slug}-${Date.now()}`,
        title: `${direction} ${r.name}: ${r.price.toLocaleString()} IRR`,
        summary: `${r.name} | Price: ${r.price.toLocaleString()} IRR | Change: ${r.change > 0 ? "+" : ""}${r.changePercent.toFixed(1)}%`,
        url: "https://www.tgju.org/",
        source: "Iran Market",
        category: "finance",
        severity,
        publishedAt: r.updatedAt || new Date().toISOString(),
        countryCode: "IR",
      };
    });
  } catch {
    return [];
  }
}
