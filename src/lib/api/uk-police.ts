/**
 * UK Police Data API — Street-level crime data for England, Wales and NI.
 * Free, no API key required.
 * https://data.police.uk/docs/
 */

import type { IntelItem, Severity } from "@/types/intel";

interface UkCrime {
  category: string;
  location_type: string;
  location: {
    latitude: string;
    longitude: string;
    street: { id: number; name: string };
  };
  context: string;
  outcome_status: { category: string; date: string } | null;
  persistent_id: string;
  id: number;
  location_subtype: string;
  month: string;
}

const CRIME_SEVERITY: Record<string, Severity> = {
  "violent-crime": "high",
  "robbery": "high",
  "possession-of-weapons": "high",
  "public-order": "medium",
  "criminal-damage-arson": "medium",
  "drugs": "medium",
  "burglary": "medium",
  "vehicle-crime": "low",
  "bicycle-theft": "low",
  "shoplifting": "low",
  "theft-from-the-person": "low",
  "other-theft": "low",
  "other-crime": "info",
  "anti-social-behaviour": "info",
};

function formatCategory(cat: string): string {
  return cat
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Fetch street-level crime data from UK Police API.
 * Defaults to central London; accepts custom lat/lng and date.
 */
export async function fetchUkCrimeData(
  lat = 51.5074,
  lng = -0.1278,
  date?: string,
  limit = 30
): Promise<IntelItem[]> {
  try {
    const dateParam = date || getLastAvailableMonth();
    const url = `https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${dateParam}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data: UkCrime[] = await res.json();
    if (!Array.isArray(data)) return [];

    return data.slice(0, limit).map((crime): IntelItem => ({
      id: `ukpolice-${crime.id || crime.persistent_id}`,
      title: `${formatCategory(crime.category)}: ${crime.location?.street?.name || "Unknown Location"}`,
      summary: `Month: ${crime.month} | Outcome: ${crime.outcome_status?.category || "Under investigation"} | Type: ${crime.location_type}`,
      url: "https://data.police.uk/",
      source: "UK Police",
      category: "conflict",
      severity: CRIME_SEVERITY[crime.category] || "info",
      publishedAt: `${crime.month}-01T00:00:00Z`,
      lat: crime.location ? parseFloat(crime.location.latitude) : undefined,
      lng: crime.location ? parseFloat(crime.location.longitude) : undefined,
      countryCode: "GB",
    }));
  } catch {
    return [];
  }
}

function getLastAvailableMonth(): string {
  // UK Police data is typically 2-3 months behind
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
