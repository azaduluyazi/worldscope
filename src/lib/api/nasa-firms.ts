/**
 * NASA FIRMS — Fire Information for Resource Management System
 * Satellite-detected thermal anomalies (wildfires, volcanic activity).
 * Free: requires MAP_KEY registration at https://firms.modaps.eosdis.nasa.gov/api/
 */

import type { IntelItem } from "@/types/intel";

const FIRMS_BASE = "https://firms.modaps.eosdis.nasa.gov/api/area/csv";

export interface FireHotspot {
  latitude: number;
  longitude: number;
  brightness: number;
  confidence: string; // "low" | "nominal" | "high"
  acqDate: string;
  satellite: string;
  countryId: string;
}

/** Fetch active fire hotspots from NASA FIRMS (last 24h) */
export async function fetchFireHotspots(limit = 50): Promise<IntelItem[]> {
  const apiKey = process.env.NASA_FIRMS_API_KEY;
  if (!apiKey) return [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    // Fetch VIIRS SNPP global data for last 24h
    const res = await fetch(
      `${FIRMS_BASE}/${apiKey}/VIIRS_SNPP_NRT/world/1`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) return [];

    const csv = await res.text();
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",");
    const latIdx = headers.indexOf("latitude");
    const lngIdx = headers.indexOf("longitude");
    const brightIdx = headers.indexOf("bright_ti4");
    const confIdx = headers.indexOf("confidence");
    const dateIdx = headers.indexOf("acq_date");
    const satIdx = headers.indexOf("satellite");

    // Parse and sort by brightness (highest = most significant)
    const fires = lines.slice(1)
      .map((line) => {
        const cols = line.split(",");
        return {
          lat: parseFloat(cols[latIdx]),
          lng: parseFloat(cols[lngIdx]),
          brightness: parseFloat(cols[brightIdx]) || 0,
          confidence: cols[confIdx] || "nominal",
          date: cols[dateIdx] || "",
          satellite: cols[satIdx] || "VIIRS",
        };
      })
      .filter((f) => !isNaN(f.lat) && !isNaN(f.lng) && f.confidence !== "low")
      .sort((a, b) => b.brightness - a.brightness)
      .slice(0, limit);

    return fires.map((f, i): IntelItem => ({
      id: `firms-${f.lat.toFixed(2)}-${f.lng.toFixed(2)}-${i}`,
      title: `Fire/Thermal Anomaly Detected (${f.brightness.toFixed(0)}K brightness)`,
      summary: `Satellite: ${f.satellite} | Confidence: ${f.confidence} | Date: ${f.date}`,
      url: "https://firms.modaps.eosdis.nasa.gov/map/",
      source: "NASA FIRMS",
      category: "natural",
      severity: f.brightness > 400 ? "high" : f.brightness > 350 ? "medium" : "low",
      publishedAt: f.date ? `${f.date}T12:00:00Z` : new Date().toISOString(),
      lat: f.lat,
      lng: f.lng,
    }));
  } catch {
    return [];
  }
}
