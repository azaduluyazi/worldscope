/**
 * OpenAQ — Global air quality measurements
 * https://docs.openaq.org/
 */
import type { IntelItem } from "@/types/intel";

export async function fetchAirQualityAlerts(): Promise<IntelItem[]> {
  const apiKey = process.env.OPENAQ_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      "https://api.openaq.org/v2/measurements?limit=30&order_by=datetime&sort=desc&parameter=pm25&value_from=100",
      { signal: AbortSignal.timeout(10000), headers: { "X-API-Key": apiKey } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.results || []).slice(0, 15).map((m: Record<string, unknown>, i: number): IntelItem => {
      const coords = m.coordinates as { latitude: number; longitude: number } | null;
      const value = Number(m.value || 0);
      return {
        id: `openaq-${i}-${Date.now()}`,
        title: `Hazardous Air Quality: PM2.5 ${value} µg/m³ at ${String(m.location || "Unknown")}`,
        summary: `Country: ${String(m.country || "?")} | Parameter: ${String(m.parameter || "pm25")} | City: ${String(m.city || "?")}`,
        url: "https://explore.openaq.org/",
        source: "OpenAQ",
        category: "health",
        severity: value > 300 ? "critical" : value > 200 ? "high" : "medium",
        publishedAt: String((m.date as Record<string, string>)?.utc || new Date().toISOString()),
        lat: coords?.latitude,
        lng: coords?.longitude,
      };
    });
  } catch { return []; }
}
