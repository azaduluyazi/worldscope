/**
 * Binance — Top Crypto Tickers (24hr).
 * Source: https://api.binance.com/api/v3/ticker/24hr
 * No API key required for public market data.
 */

import type { IntelItem } from "@/types/intel";

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
}

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];

const SYMBOL_LABELS: Record<string, string> = {
  BTCUSDT: "BTC/USDT",
  ETHUSDT: "ETH/USDT",
  SOLUSDT: "SOL/USDT",
  BNBUSDT: "BNB/USDT",
  XRPUSDT: "XRP/USDT",
};

export async function fetchBinanceTickers(): Promise<IntelItem[]> {
  try {
    const symbolsParam = encodeURIComponent(JSON.stringify(SYMBOLS));
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsParam}`,
      { signal: AbortSignal.timeout(10000), next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data: BinanceTicker[] = await res.json();

    return data.map((ticker, idx) => {
      const pct = parseFloat(ticker.priceChangePercent);
      const severity =
        Math.abs(pct) >= 10 ? "critical" : Math.abs(pct) >= 5 ? "high" : "info";
      const label = SYMBOL_LABELS[ticker.symbol] || ticker.symbol;
      const price = parseFloat(ticker.lastPrice).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      });
      const sign = pct >= 0 ? "+" : "";

      return {
        id: `binance-${ticker.symbol}-${idx}`,
        title: `${label}: $${price} (${sign}${pct.toFixed(2)}%)`,
        summary: `High: $${ticker.highPrice} | Low: $${ticker.lowPrice} | Vol: ${parseFloat(ticker.volume).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        url: `https://www.binance.com/en/trade/${ticker.symbol}`,
        source: "Binance",
        category: "finance" as const,
        severity,
        publishedAt: new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}
