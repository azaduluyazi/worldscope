import type { AircraftState, AircraftCategory } from "@/types/tracking";

/**
 * Aircraft tracking via adsb.lol — free, no key, real-time ADS-B data.
 * Replaces OpenSky Network (429 rate limit issues).
 *
 * Endpoints:
 * - /v2/mil — military aircraft worldwide (~500+)
 * - /v2/ladd — FAA LADD restricted aircraft (~600+)
 * - /v2/all — all aircraft (very large, not used)
 */

const ADSB_BASE = "https://api.adsb.lol/v2";

function classifyAircraft(flags: number | undefined, type: string | undefined): AircraftCategory {
  // dbFlags: 1 = military
  if (flags === 1) return "military";
  const t = (type || "").toUpperCase();
  if (t.startsWith("C") && /C17|C130|C5|C40/.test(t)) return "military";
  if (t.startsWith("KC") || t.startsWith("E3") || t.startsWith("B52")) return "military";
  if (/747F|777F|MD11/.test(t)) return "cargo";
  return "unknown";
}

interface AdsbAircraft {
  hex: string;
  flight?: string;
  lat?: number;
  lon?: number;
  alt_baro?: number | string;
  gs?: number;
  track?: number;
  t?: string;        // aircraft type (e.g. "H47", "C17")
  desc?: string;     // description
  dbFlags?: number;  // 1 = military
  r?: string;        // registration
  baro_rate?: number;
  squawk?: string;
}

/** Fetch military aircraft from adsb.lol */
export async function fetchMilitaryAircraft(): Promise<AircraftState[]> {
  try {
    const res = await fetch(`${ADSB_BASE}/mil`, {
      signal: AbortSignal.timeout(12000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data: { ac: AdsbAircraft[] } = await res.json();
    if (!data?.ac) return [];

    return data.ac
      .filter((a) => a.lat != null && a.lon != null)
      .map((a): AircraftState => ({
        icao24: a.hex,
        callsign: a.flight?.trim() || null,
        originCountry: a.r || "Unknown",
        latitude: a.lat!,
        longitude: a.lon!,
        altitude: typeof a.alt_baro === "number" ? a.alt_baro : null,
        velocity: a.gs ?? null,
        heading: a.track ?? null,
        verticalRate: a.baro_rate ?? null,
        onGround: a.alt_baro === "ground",
        squawk: a.squawk || null,
        lastContact: Math.floor(Date.now() / 1000),
        category: classifyAircraft(a.dbFlags, a.t),
      }))
      .slice(0, 500);
  } catch {
    return [];
  }
}

/** Fetch global aircraft — military + LADD restricted */
export async function fetchGlobalAircraft(): Promise<AircraftState[]> {
  const [mil, ladd] = await Promise.allSettled([
    fetchMilitaryAircraft(),
    fetchLaddAircraft(),
  ]);

  const all: AircraftState[] = [];
  if (mil.status === "fulfilled") all.push(...mil.value);
  if (ladd.status === "fulfilled") all.push(...ladd.value);

  // Deduplicate by icao24
  const seen = new Set<string>();
  return all.filter((a) => {
    if (seen.has(a.icao24)) return false;
    seen.add(a.icao24);
    return true;
  });
}

/** Fetch FAA LADD (Limited Aircraft Data Display) restricted aircraft */
async function fetchLaddAircraft(): Promise<AircraftState[]> {
  try {
    const res = await fetch(`${ADSB_BASE}/ladd`, {
      signal: AbortSignal.timeout(12000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data: { ac: AdsbAircraft[] } = await res.json();
    if (!data?.ac) return [];

    return data.ac
      .filter((a) => a.lat != null && a.lon != null)
      .map((a): AircraftState => ({
        icao24: a.hex,
        callsign: a.flight?.trim() || null,
        originCountry: a.r || "Unknown",
        latitude: a.lat!,
        longitude: a.lon!,
        altitude: typeof a.alt_baro === "number" ? a.alt_baro : null,
        velocity: a.gs ?? null,
        heading: a.track ?? null,
        verticalRate: a.baro_rate ?? null,
        onGround: a.alt_baro === "ground",
        squawk: a.squawk || null,
        lastContact: Math.floor(Date.now() / 1000),
        category: classifyAircraft(a.dbFlags, a.t),
      }))
      .slice(0, 300);
  } catch {
    return [];
  }
}
