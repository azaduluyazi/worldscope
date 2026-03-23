/**
 * Crypto Convert — Fast cryptocurrency conversion rates.
 * Provides real-time conversion between crypto and fiat currencies.
 * Free, no API key required for basic usage.
 * Source: coinconvert/crypto-convert
 */

import type { IntelItem } from "@/types/intel";

const CONVERT_API = "https://api.coinconvert.net/convert";

interface ConvertResult {
  status: string;
  [key: string]: string | number;
}

/**
 * Convert between currencies.
 * @param from - Source currency (e.g., "BTC")
 * @param to - Target currency (e.g., "USD")
 * @param amount - Amount to convert
 */
export async function convertCrypto(
  from: string,
  to: string,
  amount: number = 1,
): Promise<number | null> {
  try {
    const res = await fetch(
      `${CONVERT_API}/${from.toUpperCase()}/${to.toUpperCase()}?amount=${amount}`,
      {
        signal: AbortSignal.timeout(8000),
        headers: { Accept: "application/json" },
      },
    );
    if (!res.ok) return null;

    const data: ConvertResult = await res.json();
    if (data.status !== "success") return null;

    return Number(data[to.toUpperCase()]) || null;
  } catch {
    return null;
  }
}

/**
 * Fetch major crypto-to-fiat prices as intel items.
 */
export async function fetchCryptoConvertIntel(): Promise<IntelItem[]> {
  const pairs = [
    { from: "BTC", to: "USD", name: "Bitcoin" },
    { from: "ETH", to: "USD", name: "Ethereum" },
    { from: "BTC", to: "EUR", name: "Bitcoin/EUR" },
    { from: "BTC", to: "TRY", name: "Bitcoin/TRY" },
  ];

  const items: IntelItem[] = [];

  for (const pair of pairs) {
    try {
      const price = await convertCrypto(pair.from, pair.to);
      if (!price) continue;

      items.push({
        id: `convert-${pair.from}-${pair.to}-${Date.now()}`,
        title: `${pair.name}: ${price.toLocaleString()} ${pair.to}`,
        summary: `1 ${pair.from} = ${price.toLocaleString()} ${pair.to} | Real-time conversion rate`,
        url: "https://coinconvert.net/",
        source: "CryptoConvert",
        category: "finance",
        severity: "info",
        publishedAt: new Date().toISOString(),
      });
    } catch {
      continue;
    }
  }

  return items;
}
