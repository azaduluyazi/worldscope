/**
 * GBIF — Global Biodiversity Information Facility (disease vector tracking).
 * Source: https://api.gbif.org/v1/occurrence/search
 * No API key required.
 */

import type { IntelItem } from "@/types/intel";

interface GbifOccurrence {
  key?: number;
  species?: string;
  scientificName?: string;
  country?: string;
  countryCode?: string;
  decimalLatitude?: number;
  decimalLongitude?: number;
  eventDate?: string;
  datasetName?: string;
  taxonKey?: number;
  order?: string;
  family?: string;
}

interface GbifResponse {
  results: GbifOccurrence[];
  count?: number;
}

export async function fetchGbif(): Promise<IntelItem[]> {
  try {
    // taxonKey=212 = Aves (Birds — important for avian flu tracking)
    const res = await fetch(
      "https://api.gbif.org/v1/occurrence/search?limit=10&taxonKey=212&hasCoordinate=true",
      { signal: AbortSignal.timeout(10000), next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data: GbifResponse = await res.json();

    return (data.results || []).map((occ, idx) => {
      const species = occ.species || occ.scientificName || "Unknown species";
      const country = occ.country || occ.countryCode || "Unknown";
      const lat = occ.decimalLatitude?.toFixed(4) ?? "N/A";
      const lng = occ.decimalLongitude?.toFixed(4) ?? "N/A";

      return {
        id: `gbif-${occ.key ?? idx}-${idx}`,
        title: `Biodiversity: ${species} in ${country}`,
        summary: `Coordinates: ${lat}, ${lng} | Family: ${occ.family || "N/A"} | Dataset: ${occ.datasetName || "GBIF"}`,
        url: occ.key
          ? `https://www.gbif.org/occurrence/${occ.key}`
          : "https://www.gbif.org",
        source: "GBIF",
        category: "health" as const,
        severity: "info" as const,
        publishedAt: occ.eventDate
          ? new Date(occ.eventDate).toISOString()
          : new Date().toISOString(),
        lat: occ.decimalLatitude,
        lng: occ.decimalLongitude,
        countryCode: occ.countryCode,
      };
    });
  } catch {
    return [];
  }
}
