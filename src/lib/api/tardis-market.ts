/**
 * Tardis.dev — Historical & real-time crypto market data.
 * Provides normalized order book snapshots, trades, and liquidations.
 * Free tier available at https://tardis.dev/
 * Docs: https://docs.tardis.dev/
 */

import type { IntelItem } from "@/types/intel";

const TARDIS_API = "https://api.tardis.dev/v1";

interface TardisExchange {
  id: string;
  name: string;
  enabled: boolean;
  availableSince: string;
  availableChannels: string[];
}

interface TardisLiquidation {
  exchange: string;
  symbol: string;
  timestamp: string;
  side: "buy" | "sell";
  price: number;
  amount: number;
}

/**
 * Fetch available exchanges from Tardis.
 */
export async function fetchTardisExchanges(): Promise<TardisExchange[]> {
  try {
    const res = await fetch(`${TARDIS_API}/exchanges`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Fetch large liquidations as intel items.
 * Uses Tardis WebSocket replay for recent liquidation data.
 */
export async function fetchLargeTradesIntel(): Promise<IntelItem[]> {
  const apiKey = process.env.TARDIS_API_KEY;
  if (!apiKey) return [];

  try {
    // Use the REST endpoint for recent aggregated data
    const res = await fetch(`${TARDIS_API}/data-feeds/liquidations?exchange=binance-futures&symbols=BTCUSDT,ETHUSDT&from=${new Date(Date.now() - 3600000).toISOString()}&to=${new Date().toISOString()}`, {
      signal: AbortSignal.timeout(15000),
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (!res.ok) return [];

    const lines = (await res.text()).split("\n").filter(Boolean);
    const liquidations: TardisLiquidation[] = lines
      .map((line) => { try { return JSON.parse(line); } catch { return null; } })
      .filter(Boolean);

    // Group large liquidations
    const largeLiqs = liquidations.filter((l) => l.amount * l.price > 100000);

    return largeLiqs.slice(0, 10).map((l): IntelItem => {
      const valueUsd = (l.amount * l.price).toFixed(0);
      const direction = l.side === "sell" ? "🔴 Long Liquidated" : "🟢 Short Liquidated";

      return {
        id: `tardis-liq-${l.symbol}-${l.timestamp}`,
        title: `${direction}: ${l.symbol} $${Number(valueUsd).toLocaleString()}`,
        summary: `${l.exchange} | ${l.symbol} | ${l.side} liquidation at $${l.price.toFixed(2)} | Size: $${Number(valueUsd).toLocaleString()}`,
        url: "https://tardis.dev/",
        source: "Tardis",
        category: "finance",
        severity: Number(valueUsd) > 1000000 ? "high" : Number(valueUsd) > 500000 ? "medium" : "low",
        publishedAt: l.timestamp,
      };
    });
  } catch {
    return [];
  }
}
