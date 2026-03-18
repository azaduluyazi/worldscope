/**
 * Radiation monitoring data from EPA RadNet + Safecast.
 * Both free, no API key required.
 */

import type { IntelItem } from "@/types/intel";

export interface RadiationReading {
  id: string;
  location: string;
  lat: number;
  lng: number;
  value: number;      // µSv/h or CPM
  unit: string;
  source: "epa_radnet" | "safecast";
  timestamp: string;
  isElevated: boolean;
}

/** Fetch Safecast radiation measurements (global, crowdsourced) */
export async function fetchSafecastReadings(): Promise<RadiationReading[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(
      "https://api.safecast.org/measurements.json?order=created_at+desc&per_page=30",
      { signal: controller.signal, headers: { Accept: "application/json" } }
    );
    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((m: Record<string, unknown>) => m.latitude && m.longitude && m.value != null)
      .map((m: Record<string, unknown>): RadiationReading => {
        const value = Number(m.value);
        // Normal background: 0.05-0.2 µSv/h (10-50 CPM). Elevated: >0.5 µSv/h (>100 CPM)
        const isElevated = value > 100; // CPM threshold
        return {
          id: `safecast-${m.id}`,
          location: String(m.location_name || `${Number(m.latitude).toFixed(2)}°, ${Number(m.longitude).toFixed(2)}°`),
          lat: Number(m.latitude),
          lng: Number(m.longitude),
          value,
          unit: String(m.unit || "cpm"),
          source: "safecast",
          timestamp: String(m.captured_at || new Date().toISOString()),
          isElevated,
        };
      });
  } catch {
    return [];
  }
}

/** Convert radiation readings to IntelItems for the feed */
export function radiationToIntelItems(readings: RadiationReading[]): IntelItem[] {
  return readings
    .filter((r) => r.isElevated)
    .map((r): IntelItem => ({
      id: r.id,
      title: `Elevated Radiation: ${r.value} ${r.unit} at ${r.location}`,
      summary: `Source: ${r.source === "safecast" ? "Safecast (crowdsourced)" : "EPA RadNet"} | Time: ${r.timestamp}`,
      url: "https://safecast.org/tilemap/",
      source: r.source === "safecast" ? "Safecast" : "EPA RadNet",
      category: "health",
      severity: r.value > 500 ? "critical" : r.value > 200 ? "high" : "medium",
      publishedAt: r.timestamp,
      lat: r.lat,
      lng: r.lng,
    }));
}
