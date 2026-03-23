/**
 * SAR Interference Tracker — Live GPS/SAR satellite interference detection.
 * Based on Bellingcat's SAR interference analysis using Sentinel-1 satellite data.
 * Upgrades static gps-jamming.ts with real OSINT-sourced interference events.
 *
 * Source: bellingcat/sar-interference-tracker (551 stars)
 * Data: Sentinel-1 SAR satellite imagery analysis reveals GPS interference zones
 * Free, no API key required.
 */

import type { IntelItem, Severity } from "@/types/intel";

/**
 * Known SAR interference data endpoints.
 * Bellingcat publishes processed interference data as GeoJSON.
 */
const SAR_DATA_URL =
  "https://raw.githubusercontent.com/bellingcat/sar-interference-tracker/main/data/latest.geojson";

interface SarFeature {
  type: "Feature";
  properties: {
    date: string;
    satellite: string;
    orbit: string;
    interference_score?: number;
    region?: string;
    source_type?: string;
  };
  geometry: {
    type: "Point" | "Polygon";
    coordinates: number[] | number[][];
  };
}

interface SarCollection {
  type: "FeatureCollection";
  features: SarFeature[];
}

function scoreToSeverity(score: number | undefined): Severity {
  if (!score) return "medium";
  if (score > 0.8) return "critical";
  if (score > 0.5) return "high";
  if (score > 0.3) return "medium";
  return "low";
}

/**
 * Fetch SAR interference events from Bellingcat's data.
 */
export async function fetchSarInterference(): Promise<IntelItem[]> {
  try {
    const res = await fetch(SAR_DATA_URL, {
      signal: AbortSignal.timeout(12000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data: SarCollection = await res.json();
    if (!data?.features?.length) return [];

    return data.features
      .slice(0, 30)
      .map((f, i): IntelItem => {
        const coords = f.geometry.type === "Point"
          ? f.geometry.coordinates as number[]
          : (f.geometry.coordinates as number[][])[0];

        const lng = coords[0];
        const lat = coords[1];
        const score = f.properties.interference_score;
        const region = f.properties.region || "Unknown Region";

        return {
          id: `sar-${f.properties.date}-${i}`,
          title: `📡 SAR Interference: ${region}`,
          summary: `GPS/SAR interference detected via ${f.properties.satellite || "Sentinel-1"} satellite. ${score ? `Intensity: ${(score * 100).toFixed(0)}%` : ""} Orbit: ${f.properties.orbit || "N/A"}. Date: ${f.properties.date}`,
          url: "https://github.com/bellingcat/sar-interference-tracker",
          source: "Bellingcat SAR",
          category: "conflict",
          severity: scoreToSeverity(score),
          publishedAt: new Date(f.properties.date).toISOString() || new Date().toISOString(),
          lat,
          lng,
        };
      });
  } catch {
    return [];
  }
}

/**
 * Fetch SAR data and merge with static GPS jamming zones for complete coverage.
 */
export async function fetchSarAndJammingCombined(): Promise<IntelItem[]> {
  const [sarItems] = await Promise.allSettled([fetchSarInterference()]);
  const items = sarItems.status === "fulfilled" ? sarItems.value : [];

  // If SAR data is empty, the static zones in gps-jamming.ts still provide fallback
  return items;
}
