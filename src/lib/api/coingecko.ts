import type { MarketQuote } from "@/types/market";

interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
}

export async function fetchCryptoQuotes(
  ids: string[] = ["bitcoin", "ethereum"]
): Promise<MarketQuote[]> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(",")}&sparkline=false`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data: CoinGeckoMarket[] = await res.json();
    return data.map((coin) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      change: coin.current_price * (coin.price_change_percentage_24h / 100),
      changePct: coin.price_change_percentage_24h,
      currency: "USD",
      updatedAt: new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}
