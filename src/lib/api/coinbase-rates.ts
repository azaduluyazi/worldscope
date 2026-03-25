/**
 * Coinbase — USD Exchange Rates.
 * Source: https://api.coinbase.com/v2/exchange-rates
 * No API key required.
 */

import type { IntelItem } from "@/types/intel";

interface CoinbaseRatesResponse {
  data: {
    currency: string;
    rates: Record<string, string>;
  };
}

const DISPLAY_CURRENCIES = ["BTC", "ETH", "EUR", "GBP", "TRY", "JPY"];

export async function fetchCoinbaseRates(): Promise<IntelItem[]> {
  try {
    const res = await fetch(
      "https://api.coinbase.com/v2/exchange-rates?currency=USD",
      { signal: AbortSignal.timeout(10000), next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const data: CoinbaseRatesResponse = await res.json();
    const rates = data?.data?.rates;
    if (!rates) return [];

    return DISPLAY_CURRENCIES.filter((c) => rates[c]).map((currency, idx) => {
      const rate = parseFloat(rates[currency]);
      const formatted = rate < 0.01
        ? rate.toExponential(4)
        : rate.toLocaleString("en-US", { maximumFractionDigits: 4 });

      return {
        id: `coinbase-rates-${currency}-${idx}`,
        title: `1 USD = ${formatted} ${currency}`,
        summary: `Coinbase exchange rate: USD to ${currency} at ${formatted}`,
        url: "https://www.coinbase.com/converter",
        source: "Coinbase",
        category: "finance" as const,
        severity: "info" as const,
        publishedAt: new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}
