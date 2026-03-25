/**
 * Finviz — Market Movers (Top Gainers).
 * Source: https://finviz.com/export.ashx (CSV screener export)
 * No API key required.
 */

import type { IntelItem } from "@/types/intel";

function parseFinvizCsv(csv: string): Array<Record<string, string>> {
  const lines = csv.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.replace(/"/g, "").trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

export async function fetchFinvizMovers(): Promise<IntelItem[]> {
  try {
    const res = await fetch(
      "https://finviz.com/export.ashx?v=152&f=ta_change_u5&ft=4",
      {
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/csv,text/plain,*/*",
        },
        next: { revalidate: 900 },
      }
    );
    if (!res.ok) return [];
    const csv = await res.text();
    const rows = parseFinvizCsv(csv);

    const sorted = rows
      .map((r) => ({ data: r, _change: parseFloat(r["Change"] || "0") }))
      .sort((a, b) => b._change - a._change)
      .slice(0, 10);

    return sorted.map(({ data: row }, idx) => {
      const ticker = row["Ticker"] || "N/A";
      const change = row["Change"] || "0%";
      const sector = row["Sector"] || "N/A";
      const marketCap = row["Market Cap"] || "N/A";

      return {
        id: `finviz-${ticker}-${idx}`,
        title: `${ticker} ${change}`,
        summary: `Sector: ${sector} | Market Cap: ${marketCap}`,
        url: `https://finviz.com/quote.ashx?t=${ticker}`,
        source: "Finviz",
        category: "finance" as const,
        severity: "info" as const,
        publishedAt: new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}
