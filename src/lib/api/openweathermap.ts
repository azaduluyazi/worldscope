import type { IntelItem, Severity } from "@/types/intel";
import { cachedFetch, TTL } from "@/lib/cache/redis";

/**
 * OpenWeatherMap — Weather alerts for key global cities.
 * Requires API key (free tier available).
 * Docs: https://openweathermap.org/api/one-call-3
 */

const OWM_API = "https://api.openweathermap.org/data/3.0/onecall";

const ALERT_SEVERITY: Record<string, Severity> = {
  extreme: "critical",
  severe: "high",
  moderate: "medium",
  minor: "low",
};

// Monitor key cities: Istanbul, London, NYC, Tokyo, Mumbai
const CITIES = [
  { lat: 41.01, lon: 28.98, name: "Istanbul" },
  { lat: 51.51, lon: -0.13, name: "London" },
  { lat: 40.71, lon: -74.01, name: "New York" },
  { lat: 35.68, lon: 139.69, name: "Tokyo" },
  { lat: 19.08, lon: 72.88, name: "Mumbai" },
];

export async function fetchWeatherAlerts(): Promise<IntelItem[]> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) return [];

  return cachedFetch<IntelItem[]>(
    "owm:alerts",
    async () => {
      const results: IntelItem[] = [];

      for (const city of CITIES) {
        try {
          const res = await fetch(
            `${OWM_API}?lat=${city.lat}&lon=${city.lon}&exclude=minutely,hourly,daily&appid=${apiKey}`,
            { signal: AbortSignal.timeout(10000) }
          );
          if (!res.ok) continue;
          const json = await res.json();

          for (const alert of json.alerts || []) {
            results.push({
              id: `owm-${city.name}-${alert.start}`,
              title: `Weather Alert: ${alert.event} in ${city.name}`,
              summary: alert.description?.slice(0, 300) || "",
              url: `https://openweathermap.org/city/${city.lat},${city.lon}`,
              source: alert.sender_name || "OpenWeatherMap",
              category: "natural",
              severity:
                ALERT_SEVERITY[alert.tags?.[0]?.toLowerCase()] || "medium",
              publishedAt: new Date(alert.start * 1000).toISOString(),
              lat: city.lat,
              lng: city.lon,
            });
          }
        } catch {
          /* skip city on error */
        }
      }

      return results;
    },
    TTL.THREAT
  );
}
