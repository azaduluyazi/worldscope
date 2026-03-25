/**
 * FreeForexAPI — Live Forex Rates.
 * Source: https://www.freeforexapi.com/api/live
 * No API key required.
 */

import type { IntelItem } from "@/types/intel";

interface ForexRate {
  rate: number;
  timestamp: number;
}

interface ForexResponse {
  rates: Record<string, ForexRate>;
  code: number;
}

const PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "USDTRY", "XAUUSD"];

export async function fetchFreeForex(): Promise<IntelItem[]> {
  try {
    const res = await fetch(
      `https://www.freeforexapi.com/api/live?pairs=${PAIRS.join(",")}`,
      { signal: AbortSignal.timeout(10000), next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const data: ForexResponse = await res.json();
    if (!data.rates) return [];

    return Object.entries(data.rates).map(([pair, info], idx) => {
      const base = pair.slice(0, 3);
      const quote = pair.slice(3);
      const rate = info.rate?.toFixed(4) ?? "N/A";

      return {
        id: `freeforex-${pair}-${idx}`,
        title: `${base}/${quote}: ${rate}`,
        summary: `Live exchange rate: 1 ${base} = ${rate} ${quote}`,
        url: "https://www.freeforexapi.com",
        source: "FreeForexAPI",
        category: "finance" as const,
        severity: "info" as const,
        publishedAt: info.timestamp
          ? new Date(info.timestamp * 1000).toISOString()
          : new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}
