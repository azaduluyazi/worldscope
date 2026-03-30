/**
 * WorldPop — Population Data REST API
 * Free, no API key required.
 * https://hub.worldpop.org/rest/data/pop/wpgp
 */

import { gatewayFetch } from "@/lib/api/gateway";

export interface WorldPopDataset {
  country: string;
  countryCode: string;
  title: string;
  year: number;
  population: number;
  url: string;
}

const WORLDPOP_BASE = "https://hub.worldpop.org/rest/data/pop/wpgp";

/** Fetch WorldPop population density data for a country (ISO3 code) */
export async function fetchWorldPopData(
  countryCode: string
): Promise<WorldPopDataset[]> {
  return gatewayFetch(
    `worldpop-${countryCode}`,
    async () => {
      const res = await fetch(`${WORLDPOP_BASE}?iso3=${countryCode}`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return [];

      const json = await res.json();
      const items: Array<Record<string, unknown>> = json?.data || [];

      return items.map((item) => ({
        country: (item.country as string) || "",
        countryCode: (item.iso3 as string) || countryCode,
        title: (item.title as string) || "",
        year: Number(item.year || 0),
        population: Number(item.pop || item.population || 0),
        url: (item.url_summary as string) || (item.url as string) || "",
      }));
    },
    { timeoutMs: 15000, fallback: [] }
  );
}
