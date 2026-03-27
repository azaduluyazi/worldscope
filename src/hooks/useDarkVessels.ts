"use client";

import { useState, useEffect, useRef } from "react";
import type { DarkVessel } from "@/lib/api/dark-vessels";

/**
 * Track dark vessels by comparing vessel snapshots over time.
 * Stores previous snapshot in memory and detects AIS gaps.
 */
export function useDarkVessels() {
  const [darkVessels, setDarkVessels] = useState<DarkVessel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const previousSnapshotRef = useRef<Record<string, unknown>[]>([]);

  useEffect(() => {
    let mounted = true;

    async function checkDarkVessels() {
      try {
        const res = await fetch("/api/vessels");
        if (!res.ok) return;
        const data = await res.json();
        const currentVessels = data.vessels || [];

        if (previousSnapshotRef.current.length > 0) {
          // Import and run detection
          const { detectDarkVessels } = await import("@/lib/api/dark-vessels");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detected = detectDarkVessels(previousSnapshotRef.current as any, currentVessels);
          if (mounted) setDarkVessels(detected);
        }

        previousSnapshotRef.current = currentVessels;
        if (mounted) setIsLoading(false);
      } catch {
        if (mounted) setIsLoading(false);
      }
    }

    checkDarkVessels();
    const interval = setInterval(checkDarkVessels, 300_000); // 5 min
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Convert to GeoJSON for map rendering
  const geojson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: darkVessels.map((v) => ({
      type: "Feature" as const,
      properties: {
        mmsi: v.mmsi,
        name: v.name,
        risk: v.risk,
        hoursSinceAIS: v.hoursSinceAIS,
        zone: v.zone,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [v.lastKnownLng, v.lastKnownLat],
      },
    })),
  };

  return {
    darkVessels,
    geojson,
    isLoading,
    count: darkVessels.length,
    highRiskCount: darkVessels.filter((v) => v.risk === "high").length,
  };
}
