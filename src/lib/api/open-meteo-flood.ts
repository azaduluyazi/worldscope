/**
 * Open-Meteo Flood API — River Discharge Forecasts
 * Free, no API key required.
 * https://flood-api.open-meteo.com/v1/flood
 */

import { cachedFetch } from "@/lib/cache/redis";
import { TTL } from "@/lib/cache/redis";

export interface FloodForecast {
  city: string;
  lat: number;
  lng: number;
  country: string;
  discharge_m3s: number;
  risk: string;
}

const RIVER_CITIES = [
  { city: "Bangkok", country: "TH", lat: 13.75, lng: 100.5 },
  { city: "Dhaka", country: "BD", lat: 23.81, lng: 90.41 },
  { city: "Cairo", country: "EG", lat: 30.04, lng: 31.24 },
  { city: "New Orleans", country: "US", lat: 29.95, lng: -90.07 },
  { city: "Mumbai", country: "IN", lat: 19.08, lng: 72.88 },
  { city: "Shanghai", country: "CN", lat: 31.23, lng: 121.47 },
  { city: "Ho Chi Minh City", country: "VN", lat: 10.82, lng: 106.63 },
  { city: "Kolkata", country: "IN", lat: 22.57, lng: 88.36 },
  { city: "Buenos Aires", country: "AR", lat: -34.60, lng: -58.38 },
  { city: "Wuhan", country: "CN", lat: 30.59, lng: 114.31 },
  { city: "Manaus", country: "BR", lat: -3.12, lng: -60.02 },
  { city: "St. Louis", country: "US", lat: 38.63, lng: -90.20 },
  { city: "Phnom Penh", country: "KH", lat: 11.56, lng: 104.92 },
  { city: "Varanasi", country: "IN", lat: 25.32, lng: 83.01 },
  { city: "Rotterdam", country: "NL", lat: 51.92, lng: 4.48 },
  { city: "Hamburg", country: "DE", lat: 53.55, lng: 9.99 },
  { city: "Belgrade", country: "RS", lat: 44.79, lng: 20.47 },
  { city: "Budapest", country: "HU", lat: 47.50, lng: 19.04 },
  { city: "Kinshasa", country: "CD", lat: -4.32, lng: 15.31 },
  { city: "Chongqing", country: "CN", lat: 29.56, lng: 106.55 },
];

function classifyRisk(discharge: number): string {
  if (discharge > 5000) return "critical";
  if (discharge > 2000) return "high";
  if (discharge > 500) return "moderate";
  return "low";
}

export async function fetchFloodForecasts(): Promise<FloodForecast[]> {
  return cachedFetch<FloodForecast[]>(
    "flood-forecasts",
    async () => {
      try {
        const lats = RIVER_CITIES.map((c) => c.lat).join(",");
        const lngs = RIVER_CITIES.map((c) => c.lng).join(",");

        const res = await fetch(
          `https://flood-api.open-meteo.com/v1/flood?latitude=${lats}&longitude=${lngs}&daily=river_discharge&forecast_days=1`,
          { signal: AbortSignal.timeout(15000) }
        );
        if (!res.ok) return [];

        const json = await res.json();

        // Open-Meteo returns array for multi-coord requests
        const entries = Array.isArray(json) ? json : [json];
        const forecasts: FloodForecast[] = [];

        entries.forEach((entry: Record<string, unknown>, idx: number) => {
          if (idx >= RIVER_CITIES.length) return;

          const daily = entry.daily as { river_discharge?: number[] } | undefined;
          if (!daily?.river_discharge || daily.river_discharge.length === 0) return;

          // Use the max discharge from the forecast period
          const maxDischarge = Math.max(...daily.river_discharge.filter((v): v is number => v !== null));
          if (isNaN(maxDischarge) || maxDischarge <= 0) return;

          const city = RIVER_CITIES[idx];
          forecasts.push({
            city: city.city,
            lat: city.lat,
            lng: city.lng,
            country: city.country,
            discharge_m3s: Math.round(maxDischarge * 100) / 100,
            risk: classifyRisk(maxDischarge),
          });
        });

        return forecasts;
      } catch {
        return [];
      }
    },
    TTL.SLOW // 10 min — flood data updates slowly
  );
}
