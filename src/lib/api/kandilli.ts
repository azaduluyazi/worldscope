/**
 * Kandilli Rasathanesi — Turkish earthquake data.
 * Free, no API key required.
 * Source: Boğaziçi University Kandilli Observatory
 */

import type { IntelItem, Severity } from "@/types/intel";

interface KandilliQuake {
  date: string;
  time: string;
  lat: number;
  lng: number;
  depth: number;
  magnitude: number;
  location: string;
}

function magnitudeToSeverity(mag: number): Severity {
  if (mag >= 6.0) return "critical";
  if (mag >= 5.0) return "high";
  if (mag >= 4.0) return "medium";
  if (mag >= 3.0) return "low";
  return "info";
}

/**
 * Fetch recent earthquakes from Kandilli Observatory.
 * Uses the unofficial JSON API that wraps Kandilli's data.
 */
export async function fetchKandilliEarthquakes(): Promise<IntelItem[]> {
  try {
    // Primary: community-maintained API
    const res = await fetch("https://api.orhanaydogdu.com.tr/deprem/kandilli/live", {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const quakes: KandilliQuake[] = (data?.result || []).map(
      (q: Record<string, unknown>) => ({
        date: String(q.date || ""),
        time: String(q.time || ""),
        lat: Number(q.lat || 0),
        lng: Number(q.lng || 0),
        depth: Number(q.depth || 0),
        magnitude: Number(q.mag || 0),
        location: String(q.title || (q.location_properties as Record<string, Record<string, string>>)?.epiCenter?.name || "Bilinmeyen"),
      }),
    );

    return quakes
      .filter((q) => q.magnitude >= 2.5)
      .slice(0, 30)
      .map((q): IntelItem => ({
        id: `kandilli-${q.date}-${q.time}-${q.magnitude}`,
        title: `Deprem: ${q.magnitude.toFixed(1)} - ${q.location}`,
        summary: `Büyüklük ${q.magnitude.toFixed(1)} deprem. Derinlik: ${q.depth}km. Konum: ${q.location}. Tarih: ${q.date} ${q.time}`,
        url: "http://www.koeri.boun.edu.tr/scripts/lst0.asp",
        source: "Kandilli Rasathanesi",
        category: "natural",
        severity: magnitudeToSeverity(q.magnitude),
        publishedAt: new Date(`${q.date}T${q.time}`).toISOString() || new Date().toISOString(),
        lat: q.lat,
        lng: q.lng,
        countryCode: "TR",
      }));
  } catch {
    return [];
  }
}

/**
 * Fetch only significant earthquakes (4.0+) for alerts.
 */
export async function fetchKandilliAlerts(): Promise<IntelItem[]> {
  const quakes = await fetchKandilliEarthquakes();
  return quakes.filter((q) => q.severity === "critical" || q.severity === "high" || q.severity === "medium");
}
