/**
 * Yahoo Finance unofficial API client.
 * Uses the v8 quote endpoint — no API key required.
 * Rate limit: ~2000 req/hour (unofficial).
 */

export interface YahooQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketTime: number;
  currency: string;
  marketState: string; // "REGULAR" | "PRE" | "POST" | "CLOSED"
  quoteType: string;   // "EQUITY" | "ETF" | "FUTURE" | "CRYPTOCURRENCY"
}

// 29 major stock exchanges tracked by World Monitor
const STOCK_SYMBOLS = [
  "^GSPC", "^DJI", "^IXIC",    // US: S&P 500, Dow, Nasdaq
  "^FTSE",                       // UK: FTSE 100
  "^GDAXI",                     // Germany: DAX
  "^FCHI",                       // France: CAC 40
  "^N225",                       // Japan: Nikkei 225
  "000001.SS",                   // China: Shanghai Composite
  "^HSI",                        // Hong Kong: Hang Seng
  "^KS11",                       // South Korea: KOSPI
  "^TWII",                       // Taiwan: TAIEX
  "^BSESN",                      // India: BSE SENSEX
  "^BVSP",                       // Brazil: Bovespa
  "^MXX",                        // Mexico: IPC
  "^GSPTSE",                     // Canada: TSX
  "TASI.SR",                     // Saudi: Tadawul
];

// 14 commodities
const COMMODITY_SYMBOLS = [
  "CL=F",   // WTI Crude Oil
  "BZ=F",   // Brent Crude
  "NG=F",   // Natural Gas
  "GC=F",   // Gold
  "SI=F",   // Silver
  "HG=F",   // Copper
  "PL=F",   // Platinum
  "PA=F",   // Palladium
  "ALI=F",  // Aluminum
  "RB=F",   // Gasoline RBOB
  "HO=F",   // Heating Oil
  "^VIX",   // Volatility Index
  "URA",    // Uranium ETF
  "LIT",    // Lithium ETF
];

// 12 sector ETFs
const SECTOR_ETFS = [
  "XLK", "XLF", "XLE", "XLV", "XLY", "XLI",
  "XLP", "XLU", "XLB", "XLRE", "XLC", "SMH",
];

const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

async function fetchQuotes(symbols: string[]): Promise<YahooQuote[]> {
  const results: YahooQuote[] = [];

  // Batch in groups of 5 with staggered delays to avoid rate limits
  for (let i = 0; i < symbols.length; i += 5) {
    const batch = symbols.slice(i, i + 5);
    const batchResults = await Promise.allSettled(
      batch.map(async (symbol) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const res = await fetch(
            `${YAHOO_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
            {
              signal: controller.signal,
              headers: {
                "User-Agent": "Mozilla/5.0 (compatible; WorldScope/1.0)",
                Accept: "application/json",
              },
            }
          );
          clearTimeout(timeout);
          if (!res.ok) return null;

          const data = await res.json();
          const meta = data?.chart?.result?.[0]?.meta;
          if (!meta) return null;

          return {
            symbol: meta.symbol || symbol,
            shortName: meta.shortName || meta.symbol || symbol,
            regularMarketPrice: meta.regularMarketPrice || 0,
            regularMarketChange: (meta.regularMarketPrice || 0) - (meta.chartPreviousClose || meta.previousClose || 0),
            regularMarketChangePercent: meta.chartPreviousClose
              ? ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100
              : 0,
            regularMarketTime: meta.regularMarketTime || 0,
            currency: meta.currency || "USD",
            marketState: meta.marketState || "CLOSED",
            quoteType: meta.instrumentType || "EQUITY",
          } as YahooQuote;
        } catch {
          clearTimeout(timeout);
          return null;
        }
      })
    );

    for (const r of batchResults) {
      if (r.status === "fulfilled" && r.value) results.push(r.value);
    }

    // Stagger batches by 200ms
    if (i + 5 < symbols.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}

/** Fetch global stock index quotes */
export async function fetchStockIndices(): Promise<YahooQuote[]> {
  return fetchQuotes(STOCK_SYMBOLS);
}

/** Fetch commodity futures quotes */
export async function fetchCommodities(): Promise<YahooQuote[]> {
  return fetchQuotes(COMMODITY_SYMBOLS);
}

/** Fetch sector ETF quotes */
export async function fetchSectorETFs(): Promise<YahooQuote[]> {
  return fetchQuotes(SECTOR_ETFS);
}

/** Fetch all market data in one call */
export async function fetchAllMarketData(): Promise<{
  indices: YahooQuote[];
  commodities: YahooQuote[];
  sectors: YahooQuote[];
}> {
  const [indices, commodities, sectors] = await Promise.allSettled([
    fetchStockIndices(),
    fetchCommodities(),
    fetchSectorETFs(),
  ]);

  return {
    indices: indices.status === "fulfilled" ? indices.value : [],
    commodities: commodities.status === "fulfilled" ? commodities.value : [],
    sectors: sectors.status === "fulfilled" ? sectors.value : [],
  };
}
