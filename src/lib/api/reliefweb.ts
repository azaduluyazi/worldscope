import type { IntelItem, Severity } from "@/types/intel";
import { cachedFetch, TTL } from "@/lib/cache/redis";

/**
 * ReliefWeb (UN OCHA) — Humanitarian disaster reports.
 * Free, no API key required.
 * Docs: https://api.reliefweb.int/v1
 */

const RELIEFWEB_API = "https://api.reliefweb.int/v1/reports";

interface ReliefWebReport {
  id: string;
  fields: {
    title: string;
    body?: string;
    url_alias?: string;
    source?: { name: string }[];
    date?: { created: string };
    primary_country?: {
      iso3: string;
      name: string;
      location?: { lat: number; lon: number };
    };
    disaster_type?: { name: string }[];
  };
}

const DISASTER_SEVERITY: Record<string, Severity> = {
  Earthquake: "high",
  Flood: "high",
  "Tropical Cyclone": "critical",
  Epidemic: "critical",
  Drought: "medium",
  "Cold Wave": "medium",
  "Heat Wave": "medium",
  Volcano: "high",
  Tsunami: "critical",
  Wildfire: "high",
};

function mapCategory(disasterTypes: { name: string }[] | undefined): string {
  if (!disasterTypes?.length) return "diplomacy";
  const type = disasterTypes[0].name;
  if (
    [
      "Earthquake",
      "Flood",
      "Tropical Cyclone",
      "Drought",
      "Volcano",
      "Tsunami",
      "Wildfire",
      "Cold Wave",
      "Heat Wave",
    ].includes(type)
  )
    return "natural";
  if (["Epidemic"].includes(type)) return "health";
  return "diplomacy";
}

function mapSeverity(disasterTypes: { name: string }[] | undefined): Severity {
  if (!disasterTypes?.length) return "medium";
  return DISASTER_SEVERITY[disasterTypes[0].name] || "medium";
}

export async function fetchReliefWebDisasters(
  limit = 20
): Promise<IntelItem[]> {
  return cachedFetch<IntelItem[]>(
    `reliefweb:disasters:${limit}`,
    async () => {
      try {
        const params = new URLSearchParams({
          appname: "worldscope",
          "filter[field]": "date.created",
          "filter[value][from]": new Date(
            Date.now() - 7 * 86400000
          ).toISOString(),
          "fields[include][]":
            "title,body,url_alias,source,date,primary_country,disaster_type",
          "sort[]": "date.created:desc",
          limit: String(limit),
        });

        const res = await fetch(`${RELIEFWEB_API}?${params}`, {
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return [];

        const json = await res.json();
        const reports: ReliefWebReport[] = json.data || [];

        return reports.map((r) => ({
          id: `reliefweb-${r.id}`,
          title: r.fields.title,
          summary: r.fields.body?.slice(0, 300) || "",
          url:
            r.fields.url_alias || `https://reliefweb.int/node/${r.id}`,
          source: r.fields.source?.[0]?.name || "ReliefWeb",
          category: mapCategory(r.fields.disaster_type) as IntelItem["category"],
          severity: mapSeverity(r.fields.disaster_type),
          publishedAt:
            r.fields.date?.created || new Date().toISOString(),
          lat: r.fields.primary_country?.location?.lat,
          lng: r.fields.primary_country?.location?.lon,
          countryCode: r.fields.primary_country?.iso3?.slice(0, 2),
        }));
      } catch {
        return [];
      }
    },
    TTL.NEWS
  );
}
