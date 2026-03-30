/**
 * BLS — US Bureau of Labor Statistics API v2
 * Free: 500 req/day (unregistered), 500 req/day with key.
 * https://www.bls.gov/developers/
 */

import { gatewayFetch } from "@/lib/api/gateway";

export interface BlsSeries {
  seriesId: string;
  data: Array<{
    year: string;
    period: string;
    periodName: string;
    value: number;
    latest: boolean;
  }>;
}

const BLS_BASE = "https://api.bls.gov/publicAPI/v2/timeseries/data/";

/** Default series: unemployment, CPI-U, nonfarm payrolls */
const DEFAULT_SERIES = [
  "LNS14000000",  // Unemployment rate
  "CUUR0000SA0",  // CPI-U (all items)
  "CES0000000001", // Total nonfarm payrolls
];

/** Fetch BLS time series data via POST */
export async function fetchBlsData(
  seriesIds: string[] = DEFAULT_SERIES
): Promise<BlsSeries[]> {
  return gatewayFetch(
    "bls",
    async () => {
      const currentYear = new Date().getFullYear();
      const body: Record<string, unknown> = {
        seriesid: seriesIds,
        startyear: String(currentYear - 2),
        endyear: String(currentYear),
      };

      const apiKey = process.env.BLS_API_KEY;
      if (apiKey) body.registrationkey = apiKey;

      const res = await fetch(BLS_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) return [];

      const json = await res.json();
      if (json?.status !== "REQUEST_SUCCEEDED") return [];

      const results: BlsSeries[] = (json.Results?.series || []).map(
        (s: Record<string, unknown>) => ({
          seriesId: s.seriesID as string,
          data: ((s.data as Array<Record<string, unknown>>) || []).map((d) => ({
            year: d.year as string,
            period: d.period as string,
            periodName: d.periodName as string,
            value: parseFloat(d.value as string),
            latest: d.latest === "true",
          })),
        })
      );
      return results;
    },
    { timeoutMs: 20000, fallback: [] }
  );
}
