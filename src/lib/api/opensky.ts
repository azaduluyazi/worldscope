import type { AircraftState, AircraftCategory } from "@/types/tracking";

const OPENSKY_BASE = "https://opensky-network.org/api";

// Military ICAO24 address prefixes (common military allocations)
const MILITARY_PREFIXES = new Set([
  "AE", // US Military
  "AF", // US Air Force
  "43", // UK Military
  "3A", // France Military
  "3E", // Germany Military
  "33", // Italy Military
]);

function classifyAircraft(icao24: string, callsign: string | null): AircraftCategory {
  const prefix = icao24.slice(0, 2).toUpperCase();
  if (MILITARY_PREFIXES.has(prefix)) return "military";

  const cs = (callsign || "").trim().toUpperCase();
  if (cs.startsWith("RCH") || cs.startsWith("EVAC") || cs.startsWith("RRR") || cs.startsWith("DUKE")) return "military";
  if (cs.startsWith("FDX") || cs.startsWith("UPS") || cs.startsWith("GTI")) return "cargo";

  return "unknown";
}

/** Fetch all aircraft states in a bounding box from OpenSky Network */
export async function fetchAircraftStates(
  bounds?: { lamin: number; lamax: number; lomin: number; lomax: number }
): Promise<AircraftState[]> {
  try {
    let url = `${OPENSKY_BASE}/states/all`;
    if (bounds) {
      url += `?lamin=${bounds.lamin}&lamax=${bounds.lamax}&lomin=${bounds.lomin}&lomax=${bounds.lomax}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeout);

    if (!res.ok) return [];

    const data = await res.json();
    if (!data?.states) return [];

    return data.states
      .filter((s: (string | number | boolean | null)[]) => s[5] != null && s[6] != null)
      .map((s: (string | number | boolean | null)[]): AircraftState => ({
        icao24: String(s[0]),
        callsign: s[1] ? String(s[1]).trim() : null,
        originCountry: String(s[2]),
        longitude: s[5] as number,
        latitude: s[6] as number,
        altitude: s[7] as number | null,
        velocity: s[9] as number | null,
        heading: s[10] as number | null,
        verticalRate: s[11] as number | null,
        onGround: s[8] as boolean,
        squawk: s[14] ? String(s[14]) : null,
        lastContact: s[4] as number,
        category: classifyAircraft(String(s[0]), s[1] ? String(s[1]) : null),
      }))
      .slice(0, 500); // Limit to prevent massive payloads
  } catch {
    return [];
  }
}

/** Fetch aircraft in hotspot regions (Middle East, Europe, Asia-Pacific) */
export async function fetchGlobalAircraft(): Promise<AircraftState[]> {
  const hotspots = [
    { lamin: 25, lamax: 42, lomin: 25, lomax: 55 },   // Middle East
    { lamin: 44, lamax: 56, lomin: 22, lomax: 45 },   // Eastern Europe/Black Sea
    { lamin: 20, lamax: 40, lomin: 100, lomax: 130 },  // East Asia
  ];

  const results = await Promise.allSettled(
    hotspots.map((b) => fetchAircraftStates(b))
  );

  const allAircraft: AircraftState[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") allAircraft.push(...r.value);
  }

  // Deduplicate by icao24
  const seen = new Set<string>();
  return allAircraft.filter((a) => {
    if (seen.has(a.icao24)) return false;
    seen.add(a.icao24);
    return true;
  });
}
