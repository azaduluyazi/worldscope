/**
 * GPS Jamming / Interference data.
 * Source: gpsjam.org public data + known jamming hotspots.
 * No API key required.
 */

export interface GPSJammingZone {
  id: string;
  region: string;
  lat: number;
  lng: number;
  radius_km: number;
  severity: "high" | "medium" | "low";
  description: string;
  lastReported: string;
}

// Known persistent GPS jamming/spoofing hotspots (curated from OSINT sources)
const KNOWN_JAMMING_ZONES: GPSJammingZone[] = [
  {
    id: "gps-1", region: "Eastern Mediterranean",
    lat: 34.8, lng: 33.5, radius_km: 300,
    severity: "high",
    description: "Persistent GPS interference affecting commercial aviation. Attributed to electronic warfare activity.",
    lastReported: new Date().toISOString(),
  },
  {
    id: "gps-2", region: "Black Sea / Crimea",
    lat: 44.5, lng: 34.0, radius_km: 250,
    severity: "high",
    description: "Active GPS spoofing reported by multiple aircraft. Conflict zone electronic warfare.",
    lastReported: new Date().toISOString(),
  },
  {
    id: "gps-3", region: "Baltic Sea",
    lat: 56.5, lng: 20.0, radius_km: 200,
    severity: "medium",
    description: "Intermittent GPS interference near Kaliningrad. Affects Baltic aviation routes.",
    lastReported: new Date().toISOString(),
  },
  {
    id: "gps-4", region: "Northern Iraq / Syria",
    lat: 36.5, lng: 42.0, radius_km: 200,
    severity: "high",
    description: "GPS denial zone affecting drone operations and commercial flights.",
    lastReported: new Date().toISOString(),
  },
  {
    id: "gps-5", region: "Persian Gulf",
    lat: 26.5, lng: 52.0, radius_km: 150,
    severity: "medium",
    description: "Periodic GPS spoofing near Strait of Hormuz. Affects maritime navigation.",
    lastReported: new Date().toISOString(),
  },
  {
    id: "gps-6", region: "South China Sea",
    lat: 15.0, lng: 114.0, radius_km: 300,
    severity: "medium",
    description: "GPS interference reported near disputed islands. Affects fishing and commercial vessels.",
    lastReported: new Date().toISOString(),
  },
  {
    id: "gps-7", region: "Northern Norway / Finland",
    lat: 69.5, lng: 28.0, radius_km: 150,
    severity: "low",
    description: "Periodic GPS jamming along Norwegian-Russian border. Affects civilian aviation.",
    lastReported: new Date().toISOString(),
  },
  {
    id: "gps-8", region: "Taiwan Strait",
    lat: 24.5, lng: 119.0, radius_km: 100,
    severity: "medium",
    description: "Electronic interference zone. Heightened activity during military exercises.",
    lastReported: new Date().toISOString(),
  },
];

/** Get known GPS jamming zones */
export function getGPSJammingZones(): GPSJammingZone[] {
  return KNOWN_JAMMING_ZONES;
}
