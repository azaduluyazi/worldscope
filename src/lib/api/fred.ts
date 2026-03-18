/**
 * FRED — Federal Reserve Economic Data API
 * Free: 120 req/min, registration required.
 * https://fred.stlouisfed.org/docs/api/fred/
 */

export interface FREDSeries {
  id: string;
  title: string;
  value: number;
  date: string;
  units: string;
}

const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";

// Key economic indicators
const SERIES_IDS = [
  { id: "FEDFUNDS", title: "Federal Funds Rate", units: "%" },
  { id: "CPIAUCSL", title: "Consumer Price Index (CPI)", units: "Index" },
  { id: "UNRATE", title: "Unemployment Rate", units: "%" },
  { id: "GDP", title: "US GDP", units: "Billions $" },
  { id: "DGS10", title: "10-Year Treasury Yield", units: "%" },
  { id: "DGS2", title: "2-Year Treasury Yield", units: "%" },
  { id: "T10Y2Y", title: "10Y-2Y Spread (Recession Indicator)", units: "%" },
  { id: "DEXUSEU", title: "USD/EUR Exchange Rate", units: "USD" },
  { id: "M2SL", title: "M2 Money Supply", units: "Billions $" },
  { id: "UMCSENT", title: "Consumer Sentiment", units: "Index" },
  { id: "MORTGAGE30US", title: "30-Year Mortgage Rate", units: "%" },
  { id: "DCOILWTICO", title: "WTI Crude Oil Price", units: "$/Barrel" },
];

/** Fetch latest FRED economic data */
export async function fetchFREDData(): Promise<FREDSeries[]> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return [];

  const results: FREDSeries[] = [];

  // Batch in groups of 4
  for (let i = 0; i < SERIES_IDS.length; i += 4) {
    const batch = SERIES_IDS.slice(i, i + 4);
    const batchResults = await Promise.allSettled(
      batch.map(async (series) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const res = await fetch(
            `${FRED_BASE}?series_id=${series.id}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`,
            { signal: controller.signal }
          );
          clearTimeout(timeout);
          if (!res.ok) return null;

          const data = await res.json();
          const obs = data?.observations?.[0];
          if (!obs || obs.value === ".") return null;

          return {
            id: series.id,
            title: series.title,
            value: parseFloat(obs.value),
            date: obs.date,
            units: series.units,
          } as FREDSeries;
        } catch {
          clearTimeout(timeout);
          return null;
        }
      })
    );

    for (const r of batchResults) {
      if (r.status === "fulfilled" && r.value) results.push(r.value);
    }
  }

  return results;
}
