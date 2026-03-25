/**
 * Energi Data Service — Danish Electricity Spot Prices.
 * Source: https://api.energidataservice.dk/dataset/Elspotprices
 * No API key required.
 */

import type { IntelItem } from "@/types/intel";

interface ElspotRecord {
  HourUTC: string;
  HourDK: string;
  PriceArea: string;
  SpotPriceDKK: number;
  SpotPriceEUR: number;
}

interface ElspotResponse {
  records: ElspotRecord[];
  total: number;
}

export async function fetchEnergiDataService(): Promise<IntelItem[]> {
  try {
    const filter = encodeURIComponent(JSON.stringify({ PriceArea: "DK1" }));
    const url = `https://api.energidataservice.dk/dataset/Elspotprices?limit=24&sort=HourUTC%20desc&filter=${filter}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data: ElspotResponse = await res.json();
    const records = data.records || [];

    return records.slice(0, 10).map((r, idx) => {
      const price = r.SpotPriceEUR?.toFixed(2) ?? "N/A";
      const hour = r.HourUTC ? new Date(r.HourUTC).toUTCString().slice(0, 22) : "N/A";

      return {
        id: `energidata-dk1-${idx}-${r.HourUTC}`,
        title: `DK1 Spot: €${price}/MWh`,
        summary: `Danish electricity spot price for DK1 area. Hour (UTC): ${hour}`,
        url: "https://www.energidataservice.dk",
        source: "Energi Data Service",
        category: "energy" as const,
        severity: "info" as const,
        publishedAt: r.HourUTC
          ? new Date(r.HourUTC).toISOString()
          : new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}
