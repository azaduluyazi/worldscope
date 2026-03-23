/**
 * Crisis News Aggregator — Aggregates crisis/disaster news from multiple sources.
 * Inspired by yuiseki/crisis-news-map-next.
 * Combines ReliefWeb + GDACS + RSS for crisis-focused intelligence.
 * Free, no API key required.
 */

import type { IntelItem, Severity } from "@/types/intel";

const RELIEFWEB_API = "https://api.reliefweb.int/v1/reports";

interface ReliefWebReport {
  id: number;
  fields: {
    title: string;
    body?: string;
    url_alias: string;
    date: { created: string };
    source: Array<{ name: string }>;
    country: Array<{ name: string; iso3: string; lat?: number; long?: number }>;
    disaster?: Array<{ name: string; type: Array<{ name: string }> }>;
    disaster_type?: Array<{ name: string }>;
    primary_country?: { name: string; iso3: string; lat?: number; long?: number };
  };
}

function disasterToSeverity(report: ReliefWebReport): Severity {
  const title = report.fields.title.toLowerCase();
  const disasterTypes = report.fields.disaster_type?.map((d) => d.name.toLowerCase()) || [];

  if (title.includes("flash update") || title.includes("emergency")) return "critical";
  if (disasterTypes.some((d) => d.includes("earthquake") || d.includes("tsunami") || d.includes("cyclone"))) return "high";
  if (disasterTypes.some((d) => d.includes("flood") || d.includes("drought") || d.includes("epidemic"))) return "medium";
  if (title.includes("situation report") || title.includes("sitrep")) return "medium";
  return "low";
}

/**
 * Fetch latest crisis reports from ReliefWeb.
 */
export async function fetchCrisisReports(): Promise<IntelItem[]> {
  try {
    const body = {
      appname: "worldscope",
      filter: {
        operator: "AND",
        conditions: [
          { field: "date.created", value: { from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() } },
        ],
      },
      fields: {
        include: ["title", "url_alias", "date.created", "source.name", "country.name", "country.iso3", "country.lat", "country.long", "disaster.name", "disaster_type.name", "primary_country.name", "primary_country.iso3", "primary_country.lat", "primary_country.long"],
      },
      sort: ["date.created:desc"],
      limit: 25,
    };

    const res = await fetch(RELIEFWEB_API, {
      method: "POST",
      signal: AbortSignal.timeout(12000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const reports: ReliefWebReport[] = data?.data || [];

    return reports.map((r): IntelItem => {
      const country = r.fields.primary_country || r.fields.country?.[0];
      const disasters = r.fields.disaster?.map((d) => d.name).join(", ") || "";

      return {
        id: `crisis-rw-${r.id}`,
        title: r.fields.title,
        summary: `${r.fields.source?.[0]?.name || "ReliefWeb"} | ${country?.name || "Global"}${disasters ? ` | ${disasters}` : ""}`,
        url: `https://reliefweb.int${r.fields.url_alias}`,
        source: "ReliefWeb Crisis",
        category: "natural",
        severity: disasterToSeverity(r),
        publishedAt: r.fields.date?.created || new Date().toISOString(),
        lat: country?.lat ? Number(country.lat) : undefined,
        lng: country?.long ? Number(country.long) : undefined,
        countryCode: country?.iso3?.slice(0, 2),
      };
    });
  } catch {
    return [];
  }
}
