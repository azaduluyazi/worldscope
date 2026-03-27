/**
 * CelesTrak — Satellite tracking via NORAD TLE data.
 * Free API, no key required.
 * https://celestrak.org/
 */

export interface SatellitePosition {
  id: string;
  name: string;
  noradId: number;
  latitude: number;
  longitude: number;
  altitude: number; // km
  category: "station" | "starlink" | "military" | "weather" | "science" | "other";
}

const CELESTRAK_BASE = "https://celestrak.org/NORAD/elements/gp.php";

/** Satellite group URLs — most relevant for our dashboard */
const SAT_GROUPS: { group: string; category: SatellitePosition["category"]; limit: number }[] = [
  { group: "stations", category: "station", limit: 10 },
  { group: "starlink", category: "starlink", limit: 30 },
  { group: "military", category: "military", limit: 20 },
  { group: "weather", category: "weather", limit: 15 },
  { group: "science", category: "science", limit: 10 },
];

/**
 * Simple TLE → lat/lng approximation.
 * For accurate positions, a full SGP4 propagator is needed.
 * This uses the mean motion & inclination to give a rough orbital footprint.
 */
function tleToApproxPosition(tle1: string, tle2: string): { lat: number; lng: number; alt: number } | null {
  try {
    const inclination = parseFloat(tle2.substring(8, 16).trim());
    const raan = parseFloat(tle2.substring(17, 25).trim());
    const meanMotion = parseFloat(tle2.substring(52, 63).trim());

    // Approximate altitude from mean motion (revs/day)
    const orbitalPeriod = 86400 / meanMotion; // seconds
    const a = Math.pow((orbitalPeriod / (2 * Math.PI)) ** 2 * 3.986e14, 1 / 3); // semi-major axis in meters
    const alt = (a - 6371000) / 1000; // km above Earth

    // Approximate sub-satellite point using time-based longitude drift
    const now = Date.now();
    const minuteOfDay = ((now % 86400000) / 60000);
    const lngOffset = (minuteOfDay / 1440) * 360 - 180;
    const lng = ((raan + lngOffset) % 360) - 180;

    // Latitude oscillates between +/- inclination
    const phase = (minuteOfDay * meanMotion / 1440) * 2 * Math.PI;
    const lat = inclination * Math.sin(phase);

    if (isNaN(lat) || isNaN(lng) || isNaN(alt)) return null;
    return { lat: Math.max(-90, Math.min(90, lat)), lng, alt: Math.max(0, alt) };
  } catch {
    return null;
  }
}

/** Fetch satellite positions from CelesTrak (TLE → approximate lat/lng) */
export async function fetchSatellitePositions(): Promise<SatellitePosition[]> {
  const results: SatellitePosition[] = [];

  const fetches = SAT_GROUPS.map(async ({ group, category, limit }) => {
    try {
      const res = await fetch(`${CELESTRAK_BASE}?GROUP=${group}&FORMAT=tle`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return [];

      const text = await res.text();
      const lines = text.trim().split("\n");
      const sats: SatellitePosition[] = [];

      // TLE format: 3 lines per satellite (name, line1, line2)
      for (let i = 0; i + 2 < lines.length && sats.length < limit; i += 3) {
        const name = lines[i].trim();
        const tle1 = lines[i + 1]?.trim();
        const tle2 = lines[i + 2]?.trim();
        if (!tle1 || !tle2 || !tle1.startsWith("1 ") || !tle2.startsWith("2 ")) continue;

        const noradId = parseInt(tle1.substring(2, 7).trim(), 10);
        const pos = tleToApproxPosition(tle1, tle2);
        if (!pos) continue;

        sats.push({
          id: `sat-${noradId}`,
          name,
          noradId,
          latitude: pos.lat,
          longitude: pos.lng,
          altitude: pos.alt,
          category,
        });
      }
      return sats;
    } catch {
      return [];
    }
  });

  const groups = await Promise.allSettled(fetches);
  for (const g of groups) {
    if (g.status === "fulfilled") results.push(...g.value);
  }

  return results;
}
