"use client";

import useSWR from "swr";
import type { SatellitePosition } from "@/lib/api/celestrak";

const fetcher = async (): Promise<SatellitePosition[]> => {
  // Client-side fetch to our API route
  const res = await fetch("/api/satellites");
  if (!res.ok) return [];
  const data = await res.json();
  return data.satellites || [];
};

/**
 * Track satellite positions via CelesTrak TLE data.
 * Updates every 2 minutes (orbital positions change rapidly).
 */
export function useSatelliteTracker() {
  const { data, error, isLoading } = useSWR<SatellitePosition[]>(
    "satellites",
    fetcher,
    {
      refreshInterval: 120_000, // 2 min (sats move fast)
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  );

  const satellites = data || [];

  // Convert to GeoJSON for map rendering
  const geojson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: satellites.map((s) => ({
      type: "Feature" as const,
      properties: {
        id: s.id,
        name: s.name,
        noradId: s.noradId,
        altitude: s.altitude,
        category: s.category,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [s.longitude, s.latitude],
      },
    })),
  };

  return {
    satellites,
    geojson,
    isLoading,
    isError: !!error,
    count: satellites.length,
    byCategory: {
      station: satellites.filter((s) => s.category === "station").length,
      starlink: satellites.filter((s) => s.category === "starlink").length,
      military: satellites.filter((s) => s.category === "military").length,
      weather: satellites.filter((s) => s.category === "weather").length,
      science: satellites.filter((s) => s.category === "science").length,
    },
  };
}
