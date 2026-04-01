/**
 * NOAA SWPC — Aurora Forecast (Ovation Model)
 * Free, no API key required.
 * https://services.swpc.noaa.gov/json/ovation_aurora_latest.json
 */

import { cachedFetch } from "@/lib/cache/redis";
import { TTL } from "@/lib/cache/redis";

export interface AuroraPoint {
  lat: number;
  lng: number;
  probability: number;
}

interface OvationEntry {
  Longitude: number;
  Latitude: number;
  Aurora: number;
}

interface OvationResponse {
  Observation_Time: string;
  Forecast_Time: string;
  coordinates: OvationEntry[];
}

export async function fetchAuroraForecast(): Promise<AuroraPoint[]> {
  return cachedFetch<AuroraPoint[]>(
    "aurora-forecast",
    async () => {
      try {
        const res = await fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json", {
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) return [];

        const json: OvationResponse = await res.json();
        if (!json.coordinates || !Array.isArray(json.coordinates)) return [];

        const points: AuroraPoint[] = [];

        for (const entry of json.coordinates) {
          if (entry.Aurora <= 20) continue; // filter low probability

          // NOAA returns 0-360 longitude; convert to -180..180
          let lng = entry.Longitude;
          if (lng > 180) lng -= 360;

          points.push({
            lat: entry.Latitude,
            lng,
            probability: entry.Aurora,
          });
        }

        return points;
      } catch {
        return [];
      }
    },
    TTL.SLOW // 10 min — aurora data updates ~30min
  );
}
