/**
 * OpenF1 API — Real-time Formula 1 data.
 * Free, no API key required.
 * Source: br-g/openf1 (1348 stars)
 * Provides: Live timing, driver positions, lap times, weather, radio.
 * Complements Ergast (historical) with LIVE session data.
 */

import type { IntelItem } from "@/types/intel";

const OPENF1_API = "https://api.openf1.org/v1";

interface DriverPosition {
  driver_number: number;
  position: number;
  date: string;
  meeting_key: number;
  session_key: number;
}

interface Session {
  session_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  meeting_key: number;
  country_name: string;
  circuit_short_name: string;
  year: number;
}

interface LapData {
  driver_number: number;
  lap_number: number;
  lap_duration: number;
  date_start: string;
  is_pit_out_lap: boolean;
}

interface TeamRadio {
  driver_number: number;
  recording_url: string;
  date: string;
  session_key: number;
}

// Known 2024-2025 drivers (number -> name)
const DRIVERS: Record<number, { name: string; team: string }> = {
  1: { name: "M. Verstappen", team: "Red Bull" },
  11: { name: "S. Perez", team: "Red Bull" },
  44: { name: "L. Hamilton", team: "Ferrari" },
  63: { name: "G. Russell", team: "Mercedes" },
  16: { name: "C. Leclerc", team: "Ferrari" },
  55: { name: "C. Sainz", team: "Williams" },
  4: { name: "L. Norris", team: "McLaren" },
  81: { name: "O. Piastri", team: "McLaren" },
  14: { name: "F. Alonso", team: "Aston Martin" },
  18: { name: "L. Stroll", team: "Aston Martin" },
  10: { name: "P. Gasly", team: "Alpine" },
  31: { name: "E. Ocon", team: "Haas" },
  23: { name: "A. Albon", team: "Williams" },
  27: { name: "N. Hulkenberg", team: "Sauber" },
  22: { name: "Y. Tsunoda", team: "RB" },
  77: { name: "V. Bottas", team: "Mercedes" },
  87: { name: "O. Bearman", team: "Haas" },
  30: { name: "L. Lawson", team: "RB" },
  43: { name: "F. Colapinto", team: "Alpine" },
  12: { name: "G. Bortoleto", team: "Sauber" },
};

function getDriverName(num: number): string {
  return DRIVERS[num]?.name || `#${num}`;
}

function getDriverTeam(num: number): string {
  return DRIVERS[num]?.team || "Unknown";
}

/**
 * Fetch latest/current F1 session info.
 */
export async function fetchLatestSession(): Promise<Session | null> {
  try {
    const res = await fetch(`${OPENF1_API}/sessions?session_key=latest`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

/**
 * Fetch live driver positions for a session.
 */
export async function fetchLivePositions(sessionKey: number): Promise<DriverPosition[]> {
  try {
    const res = await fetch(
      `${OPENF1_API}/position?session_key=${sessionKey}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return [];

    // Get latest position for each driver
    const latest = new Map<number, DriverPosition>();
    for (const p of data) {
      latest.set(p.driver_number, p);
    }
    return Array.from(latest.values()).sort((a, b) => a.position - b.position);
  } catch {
    return [];
  }
}

/**
 * Fetch fastest laps for a session.
 */
export async function fetchFastestLaps(sessionKey: number): Promise<LapData[]> {
  try {
    const res = await fetch(
      `${OPENF1_API}/laps?session_key=${sessionKey}&lap_number>=1`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    const data: LapData[] = await res.json();
    if (!Array.isArray(data)) return [];

    // Get fastest lap per driver
    const fastest = new Map<number, LapData>();
    for (const lap of data) {
      if (!lap.lap_duration || lap.is_pit_out_lap) continue;
      const current = fastest.get(lap.driver_number);
      if (!current || lap.lap_duration < current.lap_duration) {
        fastest.set(lap.driver_number, lap);
      }
    }
    return Array.from(fastest.values()).sort((a, b) => a.lap_duration - b.lap_duration);
  } catch {
    return [];
  }
}

/**
 * Fetch latest team radio messages.
 */
export async function fetchTeamRadio(sessionKey: number): Promise<TeamRadio[]> {
  try {
    const res = await fetch(
      `${OPENF1_API}/team_radio?session_key=${sessionKey}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.slice(-5) : [];
  } catch {
    return [];
  }
}

/**
 * Combined OpenF1 intel — session + positions + fastest laps.
 */
export async function fetchOpenF1Intel(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];

  const session = await fetchLatestSession();
  if (!session) return items;

  const isLive = new Date(session.date_end) > new Date();
  const sessionLabel = isLive ? "🔴 LIVE" : "Latest";

  // Session info
  items.push({
    id: `openf1-session-${session.session_key}`,
    title: `${sessionLabel}: F1 ${session.session_name} — ${session.circuit_short_name}, ${session.country_name}`,
    summary: `${session.session_type} | ${session.circuit_short_name} | ${new Date(session.date_start).toLocaleDateString()}`,
    url: "https://www.formula1.com",
    source: "OpenF1",
    category: "sports",
    severity: isLive ? "high" : "info",
    publishedAt: session.date_start,
    countryCode: session.country_name.slice(0, 2).toUpperCase(),
  });

  // Driver positions
  const positions = await fetchLivePositions(session.session_key);
  if (positions.length >= 3) {
    const top5 = positions.slice(0, 5);
    const posStr = top5
      .map((p) => `P${p.position} ${getDriverName(p.driver_number)}`)
      .join(" | ");

    items.push({
      id: `openf1-positions-${session.session_key}`,
      title: `🏎️ F1 ${session.session_name} Positions: ${getDriverName(positions[0].driver_number)} P1`,
      summary: posStr,
      url: "https://www.formula1.com",
      source: "OpenF1",
      category: "sports",
      severity: isLive ? "high" : "info",
      publishedAt: positions[0]?.date || session.date_start,
    });
  }

  // Fastest laps
  const laps = await fetchFastestLaps(session.session_key);
  if (laps.length >= 3) {
    const top3 = laps.slice(0, 3);
    const formatTime = (s: number) => {
      const min = Math.floor(s / 60);
      const sec = (s % 60).toFixed(3);
      return min > 0 ? `${min}:${sec.padStart(6, "0")}` : `${sec}s`;
    };

    items.push({
      id: `openf1-fastest-${session.session_key}`,
      title: `⚡ Fastest Lap: ${getDriverName(top3[0].driver_number)} — ${formatTime(top3[0].lap_duration)}`,
      summary: top3
        .map((l) => `${getDriverName(l.driver_number)} ${formatTime(l.lap_duration)} (${getDriverTeam(l.driver_number)})`)
        .join(" | "),
      url: "https://www.formula1.com",
      source: "OpenF1",
      category: "sports",
      severity: "info",
      publishedAt: top3[0]?.date_start || session.date_start,
    });
  }

  return items;
}
