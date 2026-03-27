"use client";

import useSWR from "swr";

interface FirePoint {
  lat: number;
  lng: number;
  brightness: number;
  confidence: string;
  satellite: string;
  date: string;
}

const fetcher = async (url: string): Promise<FirePoint[]> => {
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  // Intel items from NASA FIRMS have lat/lng embedded
  return (data.items || data || [])
    .filter((item: Record<string, unknown>) => item.lat && item.lng && item.source === "NASA FIRMS")
    .map((item: Record<string, unknown>) => ({
      lat: Number(item.lat),
      lng: Number(item.lng),
      brightness: 0,
      confidence: "nominal",
      satellite: "VIIRS",
      date: String(item.publishedAt || ""),
    }));
};

/**
 * Fetch fire hotspot data for map layer rendering.
 * Uses the intel feed filtered by NASA FIRMS source.
 */
export function useFireData() {
  const { data, error, isLoading } = useSWR<FirePoint[]>(
    "/api/intel?source=NASA+FIRMS&limit=100",
    fetcher,
    {
      refreshInterval: 600_000, // 10 min
      revalidateOnFocus: false,
      dedupingInterval: 300_000,
    }
  );

  // Convert to GeoJSON for Mapbox Source
  const geojson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: (data || []).map((f, i) => ({
      type: "Feature" as const,
      properties: {
        id: `fire-${i}`,
        brightness: f.brightness,
        confidence: f.confidence,
        satellite: f.satellite,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [f.lng, f.lat],
      },
    })),
  };

  return {
    fires: data || [],
    geojson,
    isLoading,
    isError: !!error,
    count: data?.length || 0,
  };
}
