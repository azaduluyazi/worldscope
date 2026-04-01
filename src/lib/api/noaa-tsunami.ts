/**
 * NOAA Weather API — Tsunami Warnings
 * Free, no API key required.
 * https://api.weather.gov/alerts/active?event=Tsunami
 */

import { cachedFetch } from "@/lib/cache/redis";
import { TTL } from "@/lib/cache/redis";

export interface TsunamiWarning {
  id: string;
  title: string;
  lat: number;
  lng: number;
  severity: string;
  description: string;
  issued: string;
}

interface NWSAlertFeature {
  id: string;
  properties: {
    id: string;
    headline: string;
    description: string;
    severity: string; // "Extreme", "Severe", "Moderate", "Minor", "Unknown"
    certainty: string;
    urgency: string;
    event: string;
    onset: string;
    expires: string;
    sent: string;
    areaDesc: string;
  };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][] | number[] | null;
  } | null;
}

interface NWSAlertResponse {
  type: "FeatureCollection";
  features: NWSAlertFeature[];
}

function extractCentroid(geometry: NWSAlertFeature["geometry"]): { lat: number; lng: number } | null {
  if (!geometry || !geometry.coordinates) return null;
  try {
    const coords = geometry.coordinates;
    // Handle Polygon: [[[lng, lat], ...]]
    if (geometry.type === "Polygon" && Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
      const ring = coords[0] as number[][];
      const sumLat = ring.reduce((s, c) => s + (c[1] ?? 0), 0);
      const sumLng = ring.reduce((s, c) => s + (c[0] ?? 0), 0);
      return { lat: sumLat / ring.length, lng: sumLng / ring.length };
    }
    // Handle Point: [lng, lat]
    if (geometry.type === "Point" && typeof coords[0] === "number") {
      return { lat: (coords as number[])[1], lng: (coords as number[])[0] };
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

function mapSeverity(nwsSeverity: string): string {
  switch (nwsSeverity) {
    case "Extreme":
      return "critical";
    case "Severe":
      return "high";
    case "Moderate":
      return "medium";
    case "Minor":
      return "low";
    default:
      return "info";
  }
}

export async function fetchTsunamiWarnings(): Promise<TsunamiWarning[]> {
  return cachedFetch<TsunamiWarning[]>(
    "tsunami-warnings",
    async () => {
      try {
        const res = await fetch("https://api.weather.gov/alerts/active?event=Tsunami", {
          signal: AbortSignal.timeout(10000),
          headers: {
            Accept: "application/geo+json",
            "User-Agent": "WorldScope/1.0 (contact@troiamedia.com)",
          },
        });
        if (!res.ok) return [];

        const json: NWSAlertResponse = await res.json();
        if (!json.features || json.features.length === 0) return [];

        const warnings: TsunamiWarning[] = [];

        for (const feature of json.features) {
          const props = feature.properties;
          const centroid = extractCentroid(feature.geometry);

          // Skip entries without any location data
          if (!centroid) continue;

          warnings.push({
            id: props.id || feature.id || `tsunami-${warnings.length}`,
            title: props.headline || props.event || "Tsunami Warning",
            lat: centroid.lat,
            lng: centroid.lng,
            severity: mapSeverity(props.severity),
            description: (props.description || "").slice(0, 500),
            issued: props.sent || props.onset || new Date().toISOString(),
          });

          if (warnings.length >= 50) break;
        }

        return warnings;
      } catch {
        return [];
      }
    },
    TTL.MEDIUM // 5 min — tsunami alerts are time-critical
  );
}
