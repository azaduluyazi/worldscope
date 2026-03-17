export interface MarketSymbol {
  symbol: string;
  name: string;
  type: "index" | "crypto" | "commodity" | "forex";
  source: "alpha-vantage" | "coingecko";
  sourceId: string;
}

export const MVP_MARKETS: MarketSymbol[] = [
  { symbol: "SPX", name: "S&P 500", type: "index", source: "alpha-vantage", sourceId: "SPY" },
  { symbol: "BTC", name: "Bitcoin", type: "crypto", source: "coingecko", sourceId: "bitcoin" },
  { symbol: "ETH", name: "Ethereum", type: "crypto", source: "coingecko", sourceId: "ethereum" },
  { symbol: "GOLD", name: "Gold", type: "commodity", source: "alpha-vantage", sourceId: "GLD" },
  { symbol: "OIL", name: "WTI Oil", type: "commodity", source: "alpha-vantage", sourceId: "USO" },
  { symbol: "EUR/USD", name: "EUR/USD", type: "forex", source: "alpha-vantage", sourceId: "EURUSD" },
];
