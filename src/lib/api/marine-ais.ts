import type { VesselPosition, VesselType } from "@/types/tracking";

/**
 * Fetch vessel positions from public maritime data sources.
 * Uses a combination of known shipping lane hotspots with simulated real-time data
 * based on known routes + randomized positioning along major shipping corridors.
 *
 * For production: integrate AISHub (requires AIS receiver), MarineTraffic API,
 * or VesselFinder API with paid plans.
 */

// Major shipping lanes and strategic chokepoints with typical vessel counts
const MARITIME_HOTSPOTS: Array<{
  name: string;
  lat: number;
  lng: number;
  spread: number; // degrees of random spread
  typicalVessels: Array<{ type: VesselType; prefix: string }>;
  flag: string;
}> = [
  { name: "Strait of Hormuz", lat: 26.5, lng: 56.2, spread: 0.5, typicalVessels: [{ type: "tanker", prefix: "HORN" }, { type: "cargo", prefix: "GULF" }], flag: "AE" },
  { name: "Suez Canal", lat: 30.4, lng: 32.3, spread: 0.2, typicalVessels: [{ type: "cargo", prefix: "SUEZ" }, { type: "tanker", prefix: "CANAL" }], flag: "EG" },
  { name: "Bab el-Mandeb", lat: 12.6, lng: 43.3, spread: 0.3, typicalVessels: [{ type: "tanker", prefix: "BAB" }, { type: "cargo", prefix: "MAND" }], flag: "YE" },
  { name: "Strait of Malacca", lat: 2.5, lng: 101.5, spread: 0.8, typicalVessels: [{ type: "cargo", prefix: "MAL" }, { type: "tanker", prefix: "SING" }], flag: "SG" },
  { name: "South China Sea", lat: 14.5, lng: 115.0, spread: 2.0, typicalVessels: [{ type: "cargo", prefix: "SCS" }, { type: "fishing", prefix: "FISH" }, { type: "military", prefix: "NAVY" }], flag: "CN" },
  { name: "English Channel", lat: 50.8, lng: 1.2, spread: 0.5, typicalVessels: [{ type: "cargo", prefix: "CHAN" }, { type: "passenger", prefix: "FERY" }], flag: "GB" },
  { name: "Panama Canal", lat: 9.1, lng: -79.7, spread: 0.2, typicalVessels: [{ type: "cargo", prefix: "PAN" }, { type: "tanker", prefix: "PANA" }], flag: "PA" },
  { name: "Gibraltar Strait", lat: 35.9, lng: -5.5, spread: 0.3, typicalVessels: [{ type: "tanker", prefix: "GIB" }, { type: "cargo", prefix: "MED" }], flag: "ES" },
  { name: "Taiwan Strait", lat: 24.5, lng: 119.5, spread: 0.5, typicalVessels: [{ type: "cargo", prefix: "TWN" }, { type: "military", prefix: "ROC" }], flag: "TW" },
  { name: "Black Sea", lat: 43.5, lng: 34.0, spread: 1.5, typicalVessels: [{ type: "cargo", prefix: "BLK" }, { type: "tanker", prefix: "ODN" }], flag: "UA" },
  { name: "Red Sea", lat: 20.0, lng: 38.5, spread: 1.0, typicalVessels: [{ type: "tanker", prefix: "RED" }, { type: "military", prefix: "NAV" }], flag: "SA" },
  { name: "Mediterranean", lat: 36.5, lng: 15.0, spread: 2.0, typicalVessels: [{ type: "cargo", prefix: "MED" }, { type: "passenger", prefix: "CRS" }], flag: "IT" },
];

// Deterministic pseudo-random based on seed to keep positions consistent within cache window
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate realistic vessel positions along major shipping routes.
 * Updates deterministically every 5 minutes (same seed = same positions within window).
 */
export async function fetchVesselPositions(): Promise<VesselPosition[]> {
  const timeSeed = Math.floor(Date.now() / (5 * 60 * 1000)); // changes every 5 min
  const vessels: VesselPosition[] = [];
  let globalIdx = 0;

  for (const hotspot of MARITIME_HOTSPOTS) {
    const vesselCount = 3 + Math.floor(seededRandom(timeSeed + hotspot.lat * 100) * 5); // 3-7 vessels per hotspot

    for (let i = 0; i < vesselCount; i++) {
      const seed = timeSeed * 1000 + globalIdx;
      const typeInfo = hotspot.typicalVessels[i % hotspot.typicalVessels.length];
      const lat = hotspot.lat + (seededRandom(seed) - 0.5) * hotspot.spread * 2;
      const lng = hotspot.lng + (seededRandom(seed + 1) - 0.5) * hotspot.spread * 2;
      const speed = typeInfo.type === "military" ? 15 + seededRandom(seed + 2) * 10 : 8 + seededRandom(seed + 2) * 12;
      const course = seededRandom(seed + 3) * 360;
      const mmsi = `${200 + globalIdx}${String(Math.floor(seededRandom(seed + 4) * 999999)).padStart(6, "0")}`;

      vessels.push({
        mmsi,
        name: `${typeInfo.prefix}-${String(globalIdx).padStart(3, "0")}`,
        shipType: typeInfo.type,
        latitude: lat,
        longitude: lng,
        course: Math.round(course),
        speed: Math.round(speed * 10) / 10,
        heading: Math.round(course),
        destination: hotspot.name,
        flag: hotspot.flag,
        lastUpdate: new Date().toISOString(),
      });

      globalIdx++;
    }
  }

  return vessels;
}
