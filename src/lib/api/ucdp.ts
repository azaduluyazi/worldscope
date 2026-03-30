/**
 * UCDP — Uppsala Conflict Data Program GED API
 * Public access; optional token via UCDP_ACCESS_TOKEN.
 * https://ucdpapi.pcr.uu.se/api/
 */

import { gatewayFetch } from "@/lib/api/gateway";

export interface UcdpEvent {
  id: number;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  date_start: string;
  date_end: string;
  type_of_violence: number; // 1=state-based, 2=non-state, 3=one-sided
  best_fatality_estimate: number;
  source_article: string;
}

const UCDP_BASE = "https://ucdpapi.pcr.uu.se/api/gedevents/24.0.10";

/** Fetch UCDP conflict events with optional page size */
export async function fetchUcdpEvents(
  pageSize: number = 100
): Promise<UcdpEvent[]> {
  return gatewayFetch(
    "ucdp",
    async () => {
      const url = new URL(UCDP_BASE);
      url.searchParams.set("pagesize", String(pageSize));
      url.searchParams.set("page", "0");

      const token = process.env.UCDP_ACCESS_TOKEN;
      if (token) url.searchParams.set("key", token);

      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return [];

      const json = await res.json();
      const items: Array<Record<string, unknown>> = json?.Result || [];

      return items.map((item) => ({
        id: Number(item.id || 0),
        country: (item.country as string) || "",
        region: (item.region as string) || "",
        latitude: Number(item.latitude || 0),
        longitude: Number(item.longitude || 0),
        date_start: (item.date_start as string) || "",
        date_end: (item.date_end as string) || "",
        type_of_violence: Number(item.type_of_violence || 0),
        best_fatality_estimate: Number(item.best || item.best_fatality_estimate || 0),
        source_article: (item.source_article as string) || "",
      }));
    },
    { timeoutMs: 15000, fallback: [] }
  );
}
