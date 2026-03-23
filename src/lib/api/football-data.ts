/**
 * Open Football Data — League standings, team rosters, match results.
 * Complements ESPN live scores with structured historical/league data.
 * Uses football-data.org API (free tier: 10 req/min).
 *
 * Source: openfootball/football.json (901 stars)
 * Gap: ESPN provides live scores but no league tables or standings.
 */

import type { IntelItem } from "@/types/intel";

const FOOTBALL_API = "https://api.football-data.org/v4";

interface Standing {
  position: number;
  team: { id: number; name: string; crest: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

interface Match {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  homeTeam: { name: string; crest: string };
  awayTeam: { name: string; crest: string };
  score: {
    fullTime: { home: number | null; away: number | null };
  };
}

/** Major league codes */
const LEAGUES = {
  PL: { name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  PD: { name: "La Liga", flag: "🇪🇸" },
  BL1: { name: "Bundesliga", flag: "🇩🇪" },
  SA: { name: "Serie A", flag: "🇮🇹" },
  FL1: { name: "Ligue 1", flag: "🇫🇷" },
  CL: { name: "Champions League", flag: "🏆" },
};

type LeagueCode = keyof typeof LEAGUES;

/**
 * Fetch league standings.
 */
export async function fetchStandings(league: LeagueCode = "PL"): Promise<Standing[]> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(`${FOOTBALL_API}/competitions/${league}/standings`, {
      signal: AbortSignal.timeout(8000),
      headers: { "X-Auth-Token": apiKey },
    });
    if (!res.ok) return [];

    const data = await res.json();
    return data?.standings?.[0]?.table || [];
  } catch {
    return [];
  }
}

/**
 * Fetch recent match results.
 */
export async function fetchRecentMatches(league: LeagueCode = "PL", limit = 10): Promise<Match[]> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `${FOOTBALL_API}/competitions/${league}/matches?status=FINISHED&limit=${limit}`,
      {
        signal: AbortSignal.timeout(8000),
        headers: { "X-Auth-Token": apiKey },
      },
    );
    if (!res.ok) return [];

    const data = await res.json();
    return data?.matches || [];
  } catch {
    return [];
  }
}

/**
 * Fetch football data as intel items — standings changes and recent results.
 */
export async function fetchFootballIntel(): Promise<IntelItem[]> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return [];

  const items: IntelItem[] = [];

  // Get PL standings summary
  try {
    const standings = await fetchStandings("PL");
    if (standings.length >= 3) {
      const top3 = standings.slice(0, 3);
      items.push({
        id: `football-pl-standings-${Date.now()}`,
        title: `🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League: ${top3[0].team.name} leads with ${top3[0].points}pts`,
        summary: `1. ${top3[0].team.name} (${top3[0].points}pts) | 2. ${top3[1].team.name} (${top3[1].points}pts) | 3. ${top3[2].team.name} (${top3[2].points}pts)`,
        url: "https://www.football-data.org/",
        source: "Football Data",
        category: "sports",
        severity: "info",
        publishedAt: new Date().toISOString(),
      });
    }
  } catch { /* skip */ }

  // Get recent PL match results
  try {
    const matches = await fetchRecentMatches("PL", 5);
    for (const m of matches) {
      const home = m.score.fullTime.home ?? 0;
      const away = m.score.fullTime.away ?? 0;
      items.push({
        id: `football-match-${m.id}`,
        title: `⚽ ${m.homeTeam.name} ${home}-${away} ${m.awayTeam.name}`,
        summary: `Premier League Matchday ${m.matchday} | ${m.homeTeam.name} ${home} - ${away} ${m.awayTeam.name}`,
        url: "https://www.football-data.org/",
        source: "Football Data",
        category: "sports",
        severity: "info",
        publishedAt: m.utcDate,
      });
    }
  } catch { /* skip */ }

  return items;
}

export { LEAGUES as FOOTBALL_LEAGUES };
export type { Standing, Match };
