/**
 * Dark Vessel Detection — identifies ships that turned off AIS transponders.
 * Uses vessel tracking data + known dark-activity zones to flag suspicious behavior.
 */

import type { VesselPosition } from "@/types/tracking";

export interface DarkVessel {
  mmsi: string;
  name: string;
  lastKnownLat: number;
  lastKnownLng: number;
  lastSeenAt: string;
  hoursSinceAIS: number;
  risk: "high" | "medium" | "low";
  zone: string | null;
}

/** Known high-risk dark activity zones */
const DARK_ZONES: { name: string; bounds: [number, number, number, number] }[] = [
  { name: "Strait of Hormuz", bounds: [24, 54, 27, 58] },
  { name: "Strait of Malacca", bounds: [-1, 99, 6, 105] },
  { name: "Gulf of Guinea", bounds: [-2, -5, 8, 8] },
  { name: "Horn of Africa", bounds: [-2, 41, 15, 55] },
  { name: "South China Sea", bounds: [3, 105, 23, 121] },
  { name: "Black Sea", bounds: [40, 27, 47, 42] },
  { name: "Eastern Mediterranean", bounds: [31, 27, 37, 36] },
  { name: "North Korea Waters", bounds: [35, 124, 43, 132] },
  { name: "Venezuelan Coast", bounds: [8, -73, 13, -60] },
  { name: "Persian Gulf", bounds: [23, 48, 31, 56] },
];

function isInZone(lat: number, lng: number): string | null {
  for (const z of DARK_ZONES) {
    const [minLat, minLng, maxLat, maxLng] = z.bounds;
    if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
      return z.name;
    }
  }
  return null;
}

function assessRisk(hoursSinceAIS: number, zone: string | null, shipType: string): DarkVessel["risk"] {
  // High-risk zone + AIS off > 4h = high risk
  if (zone && hoursSinceAIS > 4) return "high";
  // Tanker with AIS off = elevated concern
  if (shipType === "tanker" && hoursSinceAIS > 2) return "high";
  // Any vessel AIS off > 8h
  if (hoursSinceAIS > 8) return "medium";
  // AIS off > 4h outside zones
  if (hoursSinceAIS > 4) return "medium";
  return "low";
}

/**
 * Analyze vessel positions to detect dark vessels.
 * Compares current positions with a previous snapshot to find AIS gaps.
 */
export function detectDarkVessels(
  previousSnapshot: VesselPosition[],
  currentSnapshot: VesselPosition[]
): DarkVessel[] {
  const currentMMSIs = new Set(currentSnapshot.map((v) => v.mmsi));
  const darkVessels: DarkVessel[] = [];

  for (const prev of previousSnapshot) {
    // Ship was in previous snapshot but missing from current → potential AIS off
    if (!currentMMSIs.has(prev.mmsi) && prev.latitude && prev.longitude) {
      const lastSeenAt = prev.lastUpdate || new Date().toISOString();
      const hoursSinceAIS = (Date.now() - new Date(lastSeenAt).getTime()) / (1000 * 60 * 60);

      // Only flag if AIS off for > 2 hours
      if (hoursSinceAIS < 2) continue;

      const zone = isInZone(prev.latitude, prev.longitude);
      const risk = assessRisk(hoursSinceAIS, zone, prev.shipType);

      darkVessels.push({
        mmsi: prev.mmsi,
        name: prev.name || "Unknown",
        lastKnownLat: prev.latitude,
        lastKnownLng: prev.longitude,
        lastSeenAt,
        hoursSinceAIS: Math.round(hoursSinceAIS * 10) / 10,
        risk,
        zone,
      });
    }
  }

  return darkVessels.sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, low: 2 };
    return riskOrder[a.risk] - riskOrder[b.risk];
  });
}

/** Get dark activity zones as GeoJSON for map overlay */
export function getDarkZonesGeoJSON(): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: DARK_ZONES.map((z) => ({
      type: "Feature" as const,
      properties: { name: z.name },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[
          [z.bounds[1], z.bounds[0]],
          [z.bounds[3], z.bounds[0]],
          [z.bounds[3], z.bounds[2]],
          [z.bounds[1], z.bounds[2]],
          [z.bounds[1], z.bounds[0]],
        ]],
      },
    })),
  };
}
