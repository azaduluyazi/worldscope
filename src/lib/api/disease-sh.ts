/**
 * Disease.sh — Open disease data API, no key required.
 * Covers COVID-19 + other disease stats.
 * https://disease.sh/docs
 */

import type { IntelItem } from "@/types/intel";

const BASE = "https://disease.sh/v3/covid-19";

export interface DiseaseStats {
  country: string;
  cases: number;
  todayCases: number;
  deaths: number;
  todayDeaths: number;
  recovered: number;
  active: number;
  critical: number;
  countryInfo: { lat: number; long: number; iso2: string };
}

/** Fetch countries with highest active outbreaks */
export async function fetchDiseaseOutbreaks(): Promise<IntelItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${BASE}/countries?sort=todayCases&yesterday=false`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    // Report countries with most active cases (COVID daily reporting largely stopped)
    // Fallback: sort by active cases if no daily data
    const hasDaily = data.some((d: DiseaseStats) => d.todayCases > 0);
    const filtered = hasDaily
      ? data.filter((d: DiseaseStats) => d.todayCases > 100 || d.todayDeaths > 5)
      : data.filter((d: DiseaseStats) => d.active > 10000);

    return filtered
      .slice(0, 15)
      .map((d: DiseaseStats): IntelItem => ({
        id: `disease-${d.countryInfo?.iso2 || d.country}-${Date.now()}`,
        title: `Disease Outbreak: ${d.country} — ${d.todayCases.toLocaleString()} new cases`,
        summary: `Deaths today: ${d.todayDeaths} | Active: ${d.active.toLocaleString()} | Critical: ${d.critical.toLocaleString()}`,
        url: "https://disease.sh/",
        source: "Disease.sh",
        category: "health",
        severity: d.todayDeaths > 200 ? "critical" : d.todayCases > 10000 ? "high" : "medium",
        publishedAt: new Date().toISOString(),
        lat: d.countryInfo?.lat,
        lng: d.countryInfo?.long,
        countryCode: d.countryInfo?.iso2,
      }));
  } catch {
    return [];
  }
}
