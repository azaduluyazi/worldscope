/**
 * ECB — European Central Bank Data API
 * Free, no API key required.
 * https://data-api.ecb.europa.eu
 */

import { gatewayFetch } from "@/lib/api/gateway";

export interface EcbExchangeRate {
  currency: string;
  rate: number;
  date: string;
}

const ECB_BASE =
  "https://data-api.ecb.europa.eu/service/data/EXR/D.USD+GBP+JPY+CHF+TRY.EUR.SP00.A";

/** Fetch daily ECB exchange rates for major currencies vs EUR */
export async function fetchEcbExchangeRates(): Promise<EcbExchangeRate[]> {
  return gatewayFetch(
    "ecb",
    async () => {
      const res = await fetch(
        `${ECB_BASE}?format=jsondata&lastNObservations=30`,
        { signal: AbortSignal.timeout(15000) }
      );
      if (!res.ok) return [];

      const data = await res.json();
      const series = data?.dataSets?.[0]?.series || {};
      const dimensions = data?.structure?.dimensions?.series || [];
      const currencyDim = dimensions.find(
        (d: Record<string, unknown>) => d.id === "CURRENCY"
      );
      const currencyValues: Array<{ id: string }> = currencyDim?.values || [];
      const timeDim = data?.structure?.dimensions?.observation?.[0];
      const timeValues: Array<{ id: string }> = timeDim?.values || [];

      const rates: EcbExchangeRate[] = [];
      for (const [key, seriesData] of Object.entries(series)) {
        const dimIndices = key.split(":");
        const currIdx = parseInt(dimIndices[0]);
        const currency = currencyValues[currIdx]?.id || "";

        const obs =
          ((seriesData as Record<string, unknown>)?.observations as Record<
            string,
            number[]
          >) || {};
        const lastEntry = Object.entries(obs).pop();
        if (lastEntry) {
          const [timeIdx, values] = lastEntry;
          rates.push({
            currency,
            rate: values[0],
            date: timeValues[parseInt(timeIdx)]?.id || "",
          });
        }
      }
      return rates;
    },
    { timeoutMs: 15000, fallback: [] }
  );
}
