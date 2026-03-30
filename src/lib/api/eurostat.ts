/**
 * Eurostat — EU Statistics API
 * Free, no API key required.
 * https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/
 */

import { gatewayFetch } from "@/lib/api/gateway";

export interface EurostatDataset {
  label: string;
  dimensions: Record<string, string[]>;
  values: Record<string, number | null>;
  updated: string;
}

const EUROSTAT_BASE =
  "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data";

/** Fetch Eurostat dataset by code (e.g. une_rt_m, prc_hicp_mmor) */
export async function fetchEurostatData(
  datasetCode: string,
  params?: Record<string, string>
): Promise<EurostatDataset | null> {
  return gatewayFetch(
    `eurostat-${datasetCode}`,
    async () => {
      const url = new URL(`${EUROSTAT_BASE}/${datasetCode}`);
      url.searchParams.set("format", "JSON");
      url.searchParams.set("lang", "en");

      if (params) {
        for (const [k, v] of Object.entries(params)) {
          url.searchParams.set(k, v);
        }
      }

      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) return null;

      const json = await res.json();
      const dimLabels: Record<string, string[]> = {};
      const dims = json?.dimension || {};
      for (const [key, dim] of Object.entries(dims)) {
        const cat = (dim as Record<string, unknown>)?.category as Record<
          string,
          unknown
        >;
        const labels = (cat?.label as Record<string, string>) || {};
        dimLabels[key] = Object.values(labels);
      }

      return {
        label: (json?.label as string) || datasetCode,
        dimensions: dimLabels,
        values: (json?.value as Record<string, number | null>) || {},
        updated: (json?.updated as string) || "",
      };
    },
    { timeoutMs: 20000, fallback: null }
  );
}
