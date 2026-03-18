import type { VariantId } from "./variants";

export interface MarketSymbol {
  symbol: string;
  name: string;
  type: "index" | "crypto" | "commodity" | "forex" | "stock" | "sector-etf";
  source: "alpha-vantage" | "coingecko";
  sourceId: string;
}

// ═══════════════════════════════════════════════════════════════
// CORE TICKER — shown in MarketTicker for all variants
// ═══════════════════════════════════════════════════════════════
export const MVP_MARKETS: MarketSymbol[] = [
  { symbol: "SPX", name: "S&P 500", type: "index", source: "alpha-vantage", sourceId: "SPY" },
  { symbol: "BTC", name: "Bitcoin", type: "crypto", source: "coingecko", sourceId: "bitcoin" },
  { symbol: "ETH", name: "Ethereum", type: "crypto", source: "coingecko", sourceId: "ethereum" },
  { symbol: "GOLD", name: "Gold", type: "commodity", source: "alpha-vantage", sourceId: "GLD" },
  { symbol: "OIL", name: "WTI Oil", type: "commodity", source: "alpha-vantage", sourceId: "USO" },
  { symbol: "EUR/USD", name: "EUR/USD", type: "forex", source: "alpha-vantage", sourceId: "EURUSD" },
];

// ═══════════════════════════════════════════════════════════════
// EXPANDED — Finance variant: more stocks, crypto, commodities
// ═══════════════════════════════════════════════════════════════
export const FINANCE_STOCKS: MarketSymbol[] = [
  { symbol: "DOW", name: "Dow Jones", type: "index", source: "alpha-vantage", sourceId: "DIA" },
  { symbol: "NDX", name: "NASDAQ 100", type: "index", source: "alpha-vantage", sourceId: "QQQ" },
  { symbol: "AAPL", name: "Apple", type: "stock", source: "alpha-vantage", sourceId: "AAPL" },
  { symbol: "MSFT", name: "Microsoft", type: "stock", source: "alpha-vantage", sourceId: "MSFT" },
  { symbol: "NVDA", name: "NVIDIA", type: "stock", source: "alpha-vantage", sourceId: "NVDA" },
  { symbol: "GOOGL", name: "Alphabet", type: "stock", source: "alpha-vantage", sourceId: "GOOGL" },
  { symbol: "AMZN", name: "Amazon", type: "stock", source: "alpha-vantage", sourceId: "AMZN" },
  { symbol: "META", name: "Meta", type: "stock", source: "alpha-vantage", sourceId: "META" },
  { symbol: "TSLA", name: "Tesla", type: "stock", source: "alpha-vantage", sourceId: "TSLA" },
  { symbol: "TSM", name: "TSMC", type: "stock", source: "alpha-vantage", sourceId: "TSM" },
  { symbol: "JPM", name: "JPMorgan", type: "stock", source: "alpha-vantage", sourceId: "JPM" },
  { symbol: "V", name: "Visa", type: "stock", source: "alpha-vantage", sourceId: "V" },
  { symbol: "AVGO", name: "Broadcom", type: "stock", source: "alpha-vantage", sourceId: "AVGO" },
  { symbol: "XOM", name: "Exxon", type: "stock", source: "alpha-vantage", sourceId: "XOM" },
  { symbol: "NFLX", name: "Netflix", type: "stock", source: "alpha-vantage", sourceId: "NFLX" },
];

export const FINANCE_CRYPTO: MarketSymbol[] = [
  { symbol: "BNB", name: "BNB", type: "crypto", source: "coingecko", sourceId: "binancecoin" },
  { symbol: "SOL", name: "Solana", type: "crypto", source: "coingecko", sourceId: "solana" },
  { symbol: "XRP", name: "XRP", type: "crypto", source: "coingecko", sourceId: "ripple" },
  { symbol: "ADA", name: "Cardano", type: "crypto", source: "coingecko", sourceId: "cardano" },
  { symbol: "DOGE", name: "Dogecoin", type: "crypto", source: "coingecko", sourceId: "dogecoin" },
  { symbol: "AVAX", name: "Avalanche", type: "crypto", source: "coingecko", sourceId: "avalanche-2" },
  { symbol: "LINK", name: "Chainlink", type: "crypto", source: "coingecko", sourceId: "chainlink" },
  { symbol: "TRX", name: "TRON", type: "crypto", source: "coingecko", sourceId: "tron" },
];

export const FINANCE_COMMODITIES: MarketSymbol[] = [
  { symbol: "SILVER", name: "Silver", type: "commodity", source: "alpha-vantage", sourceId: "SLV" },
  { symbol: "COPPER", name: "Copper", type: "commodity", source: "alpha-vantage", sourceId: "CPER" },
  { symbol: "NATGAS", name: "Natural Gas", type: "commodity", source: "alpha-vantage", sourceId: "UNG" },
];

export const FINANCE_FOREX: MarketSymbol[] = [
  { symbol: "GBP/USD", name: "GBP/USD", type: "forex", source: "alpha-vantage", sourceId: "GBPUSD" },
  { symbol: "USD/JPY", name: "USD/JPY", type: "forex", source: "alpha-vantage", sourceId: "USDJPY" },
  { symbol: "USD/CHF", name: "USD/CHF", type: "forex", source: "alpha-vantage", sourceId: "USDCHF" },
];

export const SECTOR_ETFS: MarketSymbol[] = [
  { symbol: "XLK", name: "Tech Sector", type: "sector-etf", source: "alpha-vantage", sourceId: "XLK" },
  { symbol: "XLF", name: "Financials", type: "sector-etf", source: "alpha-vantage", sourceId: "XLF" },
  { symbol: "XLE", name: "Energy", type: "sector-etf", source: "alpha-vantage", sourceId: "XLE" },
  { symbol: "XLV", name: "Healthcare", type: "sector-etf", source: "alpha-vantage", sourceId: "XLV" },
  { symbol: "SMH", name: "Semiconductors", type: "sector-etf", source: "alpha-vantage", sourceId: "SMH" },
];

// ═══════════════════════════════════════════════════════════════
// VARIANT TICKER — different ticker symbols per variant
// ═══════════════════════════════════════════════════════════════
export function getVariantMarkets(variant: VariantId): MarketSymbol[] {
  switch (variant) {
    case "finance":
      return [
        ...MVP_MARKETS,
        ...FINANCE_STOCKS.slice(0, 8),
        ...FINANCE_CRYPTO.slice(0, 4),
        ...FINANCE_COMMODITIES,
        ...FINANCE_FOREX,
      ];
    case "tech":
      return [
        { symbol: "SPX", name: "S&P 500", type: "index", source: "alpha-vantage", sourceId: "SPY" },
        { symbol: "NDX", name: "NASDAQ 100", type: "index", source: "alpha-vantage", sourceId: "QQQ" },
        { symbol: "BTC", name: "Bitcoin", type: "crypto", source: "coingecko", sourceId: "bitcoin" },
        { symbol: "ETH", name: "Ethereum", type: "crypto", source: "coingecko", sourceId: "ethereum" },
        // Top tech stocks
        ...FINANCE_STOCKS.filter(s => ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "TSM", "AVGO"].includes(s.symbol)),
        { symbol: "SMH", name: "Semiconductors", type: "sector-etf", source: "alpha-vantage", sourceId: "SMH" },
      ];
    default: // world
      return MVP_MARKETS;
  }
}
