/**
 * Dollar-Toman API — Iranian Rial/Toman exchange rates via TGJU.
 * Tracks USD, EUR, GBP, gold prices in Iranian market.
 * Free, no API key required.
 */

import type { IntelItem } from "@/types/intel";

// TGJU public API — Iranian financial market data
const TGJU_API = "https://api.tgju.org/v1/market/indicator/summary-table-data";

const CURRENCIES = [
  { slug: "price_dollar_rl", name: "USD/IRR" },
  { slug: "price_eur", name: "EUR/IRR" },
  { slug: "price_gbp", name: "GBP/IRR" },
  { slug: "price_try", name: "TRY/IRR" },
  { slug: "price_aed", name: "AED/IRR" },
  { slug: "geram18", name: "Gold 18K" },
  { slug: "sekee", name: "Gold Coin" },
];

interface TgjuRow {
  0: string; // current price
  1: string; // close price
  2: string; // high
  3: string; // low
  4: string; // change (HTML)
  5: string; // change percent (HTML)
}

function parseHtmlNumber(html: string): number {
  // Extract number from HTML like '<span class="low" dir="ltr">10100</span>'
  const match = html.match(/>([^<]+)</);
  if (match) return parseFloat(match[1].replace(/,/g, ""));
  return parseFloat(html.replace(/,/g, "")) || 0;
}

/**
 * Fetch Iranian market exchange rates from TGJU.
 */
export async function fetchDollarTomanRates(): Promise<Array<{
  slug: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}>> {
  const results: Array<{ slug: string; name: string; price: number; change: number; changePercent: number }> = [];

  // Fetch USD first (most important) — if it fails, return empty
  try {
    const res = await fetch(`${TGJU_API}/price_dollar_rl`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const rows: TgjuRow[] = data?.data || [];
    if (rows.length === 0) return [];

    const row = rows[0];
    const price = parseFloat(String(row[0]).replace(/,/g, ""));
    const change = parseHtmlNumber(String(row[4]));
    const changePct = parseHtmlNumber(String(row[5]));

    results.push({
      slug: "price_dollar_rl",
      name: "USD/IRR",
      price,
      change,
      changePercent: changePct,
    });
  } catch {
    return [];
  }

  // Fetch other currencies in parallel
  const others = CURRENCIES.slice(1);
  const promises = others.map(async (c) => {
    try {
      const res = await fetch(`${TGJU_API}/${c.slug}`, {
        signal: AbortSignal.timeout(5000),
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const row = data?.data?.[0];
      if (!row) return null;
      return {
        slug: c.slug,
        name: c.name,
        price: parseFloat(String(row[0]).replace(/,/g, "")),
        change: parseHtmlNumber(String(row[4])),
        changePercent: parseHtmlNumber(String(row[5])),
      };
    } catch {
      return null;
    }
  });

  const settled = await Promise.allSettled(promises);
  for (const r of settled) {
    if (r.status === "fulfilled" && r.value) results.push(r.value);
  }

  return results;
}

/**
 * Fetch as intel items for the feed.
 */
export async function fetchDollarTomanIntel(): Promise<IntelItem[]> {
  try {
    const rates = await fetchDollarTomanRates();
    if (!rates.length) return [];

    return rates.map((r): IntelItem => {
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
        publishedAt: new Date().toISOString(),
        countryCode: "IR",
      };
    });
  } catch {
    return [];
  }
}
