import type { IntelItem, Severity } from "@/types/intel";

/**
 * USGS Earthquake Hazards Program - GeoJSON Feed
 * Free, no API key required.
 * Returns earthquake data with coordinates for map markers.
 * Docs: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
 */

interface UsgsFeature {
  type: "Feature";
  properties: {
    mag: number;
    place: string;
    time: number;
    url: string;
    title: string;
    type: string;
    tsunami: number;
    alert: string | null; // "green", "yellow", "orange", "red"
  };
  geometry: {
    type: "Point";
    coordinates: [number, number, number]; // [lng, lat, depth]
  };
}

interface UsgsResponse {
  type: "FeatureCollection";
  metadata: {
    generated: number;
    count: number;
    title: string;
  };
  features: UsgsFeature[];
}

function magnitudeToSeverity(mag: number, alert: string | null): Severity {
  if (alert === "red" || mag >= 7.0) return "critical";
  if (alert === "orange" || mag >= 6.0) return "high";
  if (alert === "yellow" || mag >= 5.0) return "medium";
  if (mag >= 4.0) return "low";
  return "info";
}

/**
 * Fetch significant earthquakes from the past week
 * For more frequent data, use 4.5_week or 2.5_day endpoints
 */
export async function fetchEarthquakes(
  feed: "significant_week" | "4.5_week" | "2.5_day" | "all_hour" = "4.5_week"
): Promise<IntelItem[]> {
  const url = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${feed}.geojson`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];

    const data: UsgsResponse = await res.json();

    return data.features.map((f) => ({
      id: `usgs-${f.properties.time}`,
      title: f.properties.title,
      summary: `Magnitude ${f.properties.mag} earthquake - ${f.properties.place}. Depth: ${f.geometry.coordinates[2]}km${f.properties.tsunami ? " ⚠️ Tsunami potential" : ""}`,
      url: f.properties.url,
      source: "USGS Earthquake",
      category: "natural" as const,
      severity: magnitudeToSeverity(f.properties.mag, f.properties.alert),
      publishedAt: new Date(f.properties.time).toISOString(),
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    }));
  } catch {
    return [];
  }
}
