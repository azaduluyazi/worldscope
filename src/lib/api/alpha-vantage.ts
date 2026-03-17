import type { MarketQuote } from "@/types/market";

export async function fetchStockQuote(symbol: string): Promise<MarketQuote | null> {
  const apiKey = process.env.ALPHA_VANTAGE_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const q = data["Global Quote"];
    if (!q || !q["05. price"]) return null;

    return {
      symbol: q["01. symbol"],
      name: symbol,
      price: parseFloat(q["05. price"]),
      change: parseFloat(q["09. change"]),
      changePct: parseFloat(q["10. change percent"]?.replace("%", "") || "0"),
      currency: "USD",
      updatedAt: q["07. latest trading day"] || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function fetchForexQuote(
  fromCurrency: string,
  toCurrency: string
): Promise<MarketQuote | null> {
  const apiKey = process.env.ALPHA_VANTAGE_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${apiKey}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data["Realtime Currency Exchange Rate"];
    if (!rate) return null;

    return {
      symbol: `${fromCurrency}/${toCurrency}`,
      name: `${fromCurrency}/${toCurrency}`,
      price: parseFloat(rate["5. Exchange Rate"]),
      change: 0,
      changePct: 0,
      currency: toCurrency,
      updatedAt: rate["6. Last Refreshed"] || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
