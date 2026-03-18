/**
 * Open-Meteo — Free weather forecast API, no key required.
 * https://open-meteo.com/en/docs
 */

import type { IntelItem } from "@/types/intel";

const BASE = "https://api.open-meteo.com/v1/forecast";

export interface WeatherAlert {
  lat: number;
  lng: number;
  location: string;
  temperature: number;
  windSpeed: number;
  weatherCode: number;
  isExtreme: boolean;
}

// Major cities to monitor for extreme weather
const MONITOR_CITIES = [
  { name: "Tokyo", lat: 35.68, lng: 139.69 },
  { name: "New York", lat: 40.71, lng: -74.01 },
  { name: "London", lat: 51.51, lng: -0.13 },
  { name: "Istanbul", lat: 41.01, lng: 28.98 },
  { name: "Dubai", lat: 25.2, lng: 55.27 },
  { name: "Mumbai", lat: 19.08, lng: 72.88 },
  { name: "São Paulo", lat: -23.55, lng: -46.63 },
  { name: "Cairo", lat: 30.04, lng: 31.24 },
  { name: "Beijing", lat: 39.9, lng: 116.4 },
  { name: "Moscow", lat: 55.76, lng: 37.62 },
];

/** Fetch current weather for monitored cities, flag extreme conditions */
export async function fetchOpenMeteoAlerts(): Promise<IntelItem[]> {
  try {
    const lats = MONITOR_CITIES.map((c) => c.lat).join(",");
    const lngs = MONITOR_CITIES.map((c) => c.lng).join(",");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(
      `${BASE}?latitude=${lats}&longitude=${lngs}&current=temperature_2m,wind_speed_10m,weather_code`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = await res.json();
    const results: IntelItem[] = [];

    // Handle both array (multi-location) and single object responses
    const items = Array.isArray(data) ? data : [data];

    items.forEach((d: Record<string, unknown>, i: number) => {
      const city = MONITOR_CITIES[i];
      if (!city || !d.current) return;

      const current = d.current as Record<string, number>;
      const temp = current.temperature_2m;
      const wind = current.wind_speed_10m;
      const code = current.weather_code;

      // Flag extreme: temp > 45°C or < -30°C, wind > 100km/h, severe weather codes
      const isExtreme = temp > 45 || temp < -30 || wind > 100 || code >= 95;
      if (!isExtreme) return;

      results.push({
        id: `meteo-${city.name}-${Date.now()}`,
        title: `Extreme Weather: ${city.name} — ${temp}°C, Wind ${wind}km/h`,
        summary: `Weather code: ${code} | Conditions may impact operations and safety`,
        url: "https://open-meteo.com/",
        source: "Open-Meteo",
        category: "natural",
        severity: temp > 50 || temp < -40 || wind > 150 ? "critical" : "high",
        publishedAt: new Date().toISOString(),
        lat: city.lat,
        lng: city.lng,
      });
    });

    return results;
  } catch {
    return [];
  }
}
