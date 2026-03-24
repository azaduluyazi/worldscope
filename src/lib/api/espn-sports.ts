/**
 * ESPN API — Live sports scores, news, and standings.
 * Free, no API key required (public API).
 * Covers: Football (Soccer), NFL, NBA, MLB, NHL, F1, Tennis.
 */

import type { IntelItem, Severity } from "@/types/intel";

const ESPN_API = "https://site.api.espn.com/apis/site/v2/sports";

type Sport = "soccer" | "soccer_laliga" | "soccer_bundesliga" | "soccer_seriea" | "soccer_ligue1" | "soccer_super_lig" | "soccer_mls" | "soccer_ucl" | "football" | "basketball" | "baseball" | "hockey" | "tennis" | "rugby" | "mma";

const SPORT_PATHS: Record<Sport, string> = {
  soccer: "soccer/eng.1", // Premier League
  soccer_laliga: "soccer/esp.1", // La Liga
  soccer_bundesliga: "soccer/ger.1", // Bundesliga
  soccer_seriea: "soccer/ita.1", // Serie A
  soccer_ligue1: "soccer/fra.1", // Ligue 1
  soccer_super_lig: "soccer/tur.1", // Turkish Super Lig
  soccer_mls: "soccer/usa.1", // MLS
  soccer_ucl: "soccer/uefa.champions", // Champions League
  football: "football/nfl",
  basketball: "basketball/nba",
  baseball: "baseball/mlb",
  hockey: "hockey/nhl",
  tennis: "tennis/atp",
  rugby: "rugby/270557", // Six Nations / World Cup
  mma: "mma/ufc",
};

interface EspnEvent {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: {
    type: { state: string; description: string; completed: boolean };
    displayClock?: string;
  };
  competitions: Array<{
    competitors: Array<{
      team: { displayName: string; abbreviation: string; logo?: string };
      score: string;
      winner?: boolean;
    }>;
    venue?: { fullName: string; address?: { city: string; country?: string } };
  }>;
  links?: Array<{ href: string }>;
}

function eventToSeverity(state: string): Severity {
  if (state === "in") return "high"; // Live match
  if (state === "post") return "medium"; // Completed
  return "info"; // Upcoming
}

/**
 * Fetch live/recent scores for a sport.
 */
export async function fetchEspnScores(sport: Sport = "soccer"): Promise<IntelItem[]> {
  try {
    const path = SPORT_PATHS[sport];
    const res = await fetch(`${ESPN_API}/${path}/scoreboard`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const events: EspnEvent[] = data?.events || [];

    return events.slice(0, 15).map((e): IntelItem => {
      const comp = e.competitions?.[0];
      const teams = comp?.competitors || [];
      const home = teams.find((t) => (t as Record<string, unknown>).homeAway === "home") || teams[0];
      const away = teams.find((t) => (t as Record<string, unknown>).homeAway === "away") || teams[1];

      const state = e.status.type.state;
      const clock = e.status.displayClock || "";
      const venue = comp?.venue?.fullName || "";

      let title = e.shortName || e.name;
      if (state === "in") {
        title = `🔴 LIVE: ${away?.team.abbreviation} ${away?.score} - ${home?.score} ${home?.team.abbreviation} (${clock})`;
      } else if (state === "post") {
        title = `FT: ${away?.team.displayName} ${away?.score} - ${home?.score} ${home?.team.displayName}`;
      }

      return {
        id: `espn-${sport}-${e.id}`,
        title,
        summary: `${e.name}${venue ? ` | ${venue}` : ""} | ${e.status.type.description}`,
        url: e.links?.[0]?.href || `https://www.espn.com/${sport}`,
        source: "ESPN",
        category: "sports",
        severity: eventToSeverity(state),
        publishedAt: e.date,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Fetch sports news headlines.
 */
export async function fetchEspnNews(sport: Sport = "soccer"): Promise<IntelItem[]> {
  try {
    const path = SPORT_PATHS[sport];
    const res = await fetch(`${ESPN_API}/${path}/news`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const articles: Array<Record<string, unknown>> = data?.articles || [];

    return articles.slice(0, 10).map((a): IntelItem => ({
      id: `espn-news-${a.dataSourceIdentifier || Date.now()}`,
      title: String(a.headline || ""),
      summary: String(a.description || "").slice(0, 300),
      url: String((a.links as Record<string, Record<string, string>>)?.web?.href || "https://espn.com"),
      source: "ESPN",
      category: "sports",
      severity: "info",
      publishedAt: String(a.published || new Date().toISOString()),
      imageUrl: (a.images as Array<Record<string, string>>)?.[0]?.url,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch all major sports data combined.
 */
export async function fetchAllSportsScores(): Promise<IntelItem[]> {
  const sports: Sport[] = [
    "soccer", "soccer_laliga", "soccer_bundesliga", "soccer_seriea",
    "soccer_ucl", "soccer_super_lig",
    "basketball", "football", "baseball", "hockey", "mma",
  ];
  const results = await Promise.allSettled(sports.map((s) => fetchEspnScores(s)));
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
