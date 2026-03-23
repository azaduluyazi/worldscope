/**
 * Formula 1 — Ergast/Jolpica API. No key required.
 * Live race results, standings, schedule.
 * Source: Rafacv23/F1-api (70 stars), ergast.com replacement
 * Gap filled: SportsScope only had football — now F1 too.
 */

import type { IntelItem } from "@/types/intel";

const F1_API = "https://api.jolpi.ca/ergast/f1";

interface RaceResult {
  raceName: string;
  date: string;
  Circuit: { circuitName: string; Location: { country: string } };
  Results?: Array<{
    position: string;
    Driver: { givenName: string; familyName: string; code: string };
    Constructor: { name: string };
    Time?: { time: string };
    status: string;
  }>;
}

/**
 * Fetch latest F1 race results.
 */
export async function fetchF1Results(): Promise<IntelItem[]> {
  try {
    const res = await fetch(`${F1_API}/current/results/last.json`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const race: RaceResult = data?.MRData?.RaceTable?.Races?.[0];
    if (!race || !race.Results?.length) return [];

    const top3 = race.Results.slice(0, 3);
    const podium = top3
      .map((r) => `${r.position}. ${r.Driver.givenName} ${r.Driver.familyName} (${r.Constructor.name})`)
      .join(" | ");

    return [{
      id: `f1-result-${race.date}`,
      title: `🏎️ F1 ${race.raceName}: ${top3[0].Driver.familyName} wins!`,
      summary: `${race.Circuit.circuitName}, ${race.Circuit.Location.country} | ${podium}`,
      url: "https://www.formula1.com/en/results",
      source: "Formula 1",
      category: "sports",
      severity: "info",
      publishedAt: new Date(race.date).toISOString(),
      countryCode: race.Circuit.Location.country.slice(0, 2).toUpperCase(),
    }];
  } catch {
    return [];
  }
}

/**
 * Fetch current F1 driver standings.
 */
export async function fetchF1Standings(): Promise<IntelItem[]> {
  try {
    const res = await fetch(`${F1_API}/current/driverStandings.json`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const standings = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings;
    if (!Array.isArray(standings) || standings.length < 3) return [];

    const top5 = standings.slice(0, 5).map(
      (s: { position: string; points: string; Driver: { familyName: string }; Constructors: Array<{ name: string }> }) =>
        `${s.position}. ${s.Driver.familyName} (${s.Constructors[0]?.name}) — ${s.points}pts`
    ).join(" | ");

    return [{
      id: `f1-standings-${Date.now()}`,
      title: `🏁 F1 Championship: ${standings[0].Driver.familyName} leads with ${standings[0].points}pts`,
      summary: top5,
      url: "https://www.formula1.com/en/results",
      source: "Formula 1",
      category: "sports",
      severity: "info",
      publishedAt: new Date().toISOString(),
    }];
  } catch {
    return [];
  }
}

/**
 * Fetch upcoming F1 race schedule.
 */
export async function fetchF1NextRace(): Promise<IntelItem[]> {
  try {
    const res = await fetch(`${F1_API}/current.json`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const races = data?.MRData?.RaceTable?.Races;
    if (!Array.isArray(races)) return [];

    const now = new Date();
    const upcoming = races.filter((r: { date: string }) => new Date(r.date) > now);
    if (!upcoming.length) return [];

    const next = upcoming[0];
    const raceDate = new Date(next.date);
    const daysUntil = Math.ceil((raceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return [{
      id: `f1-next-${next.date}`,
      title: `📅 Next F1 Race: ${next.raceName} in ${daysUntil} days`,
      summary: `${next.Circuit.circuitName}, ${next.Circuit.Location.country} | ${next.date}`,
      url: "https://www.formula1.com/en/racing",
      source: "Formula 1",
      category: "sports",
      severity: "info",
      publishedAt: new Date().toISOString(),
      countryCode: next.Circuit?.Location?.country?.slice(0, 2).toUpperCase(),
    }];
  } catch {
    return [];
  }
}

/**
 * Combined F1 intel — results + standings + schedule.
 */
export async function fetchF1Intel(): Promise<IntelItem[]> {
  const [results, standings, next] = await Promise.allSettled([
    fetchF1Results(),
    fetchF1Standings(),
    fetchF1NextRace(),
  ]);

  return [
    ...(results.status === "fulfilled" ? results.value : []),
    ...(standings.status === "fulfilled" ? standings.value : []),
    ...(next.status === "fulfilled" ? next.value : []),
  ];
}
