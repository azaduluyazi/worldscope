/**
 * UNHCR — UN Refugee Agency Population Data API
 * Free, no API key required.
 * https://data.unhcr.org/api/v2/
 */

import { gatewayFetch } from "@/lib/api/gateway";

export interface UnhcrPopulation {
  country: string;
  countryCode: string;
  refugees: number;
  asylumSeekers: number;
  idps: number;
  year: number;
}

const UNHCR_BASE = "https://data.unhcr.org/api/v2/population";

/** Fetch UNHCR refugee population data, optionally filtered by country */
export async function fetchUnhcrPopulation(
  countryCode?: string
): Promise<UnhcrPopulation[]> {
  return gatewayFetch(
    "unhcr",
    async () => {
      const url = new URL(UNHCR_BASE);
      url.searchParams.set("limit", "100");
      url.searchParams.set("page", "1");
      if (countryCode) url.searchParams.set("country", countryCode);

      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return [];

      const json = await res.json();
      const items: Array<Record<string, unknown>> = json?.data || json?.items || [];

      return items.map((item) => ({
        country: (item.country_name as string) || (item.country as string) || "",
        countryCode: (item.country_code as string) || (item.iso3 as string) || "",
        refugees: Number(item.refugees || 0),
        asylumSeekers: Number(item.asylum_seekers || 0),
        idps: Number(item.idps || 0),
        year: Number(item.year || new Date().getFullYear()),
      }));
    },
    { timeoutMs: 15000, fallback: [] }
  );
}
