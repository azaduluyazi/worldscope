/**
 * NHL — Live Scores via NHL Web API.
 * Source: https://api-web.nhle.com/v1/score/now
 * No API key required.
 */

import type { IntelItem } from "@/types/intel";

interface NhlTeam {
  placeName?: { default?: string };
  commonName?: { default?: string };
  abbrev?: string;
  score?: number;
}

interface NhlGame {
  id?: number;
  gameState?: string;
  period?: number;
  periodDescriptor?: { number?: number; periodType?: string };
  homeTeam?: NhlTeam;
  awayTeam?: NhlTeam;
  venue?: { default?: string };
  startTimeUTC?: string;
}

interface NhlScoreResponse {
  games?: NhlGame[];
}

function teamName(team?: NhlTeam): string {
  return team?.commonName?.default ?? team?.abbrev ?? "TBD";
}

export async function fetchNhlScores(): Promise<IntelItem[]> {
  try {
    const res = await fetch("https://api-web.nhle.com/v1/score/now", {
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data: NhlScoreResponse = await res.json();
    const games = data.games || [];

    return games.slice(0, 15).map((game, idx) => {
      const home = teamName(game.homeTeam);
      const away = teamName(game.awayTeam);
      const homeScore = game.homeTeam?.score ?? "-";
      const awayScore = game.awayTeam?.score ?? "-";
      const state = game.gameState || "SCHEDULED";
      const period = game.periodDescriptor?.number
        ? `P${game.periodDescriptor.number}`
        : "";
      const venue = game.venue?.default || "";

      const isLive = ["LIVE", "CRIT"].includes(state);

      return {
        id: `nhl-${game.id ?? idx}-${idx}`,
        title: `${away} ${awayScore} - ${homeScore} ${home}`,
        summary: `NHL${period ? " | " + period : ""} | State: ${state}${venue ? " | " + venue : ""}`,
        url: `https://www.nhl.com/game/${game.id}`,
        source: "NHL",
        category: "sports" as const,
        severity: isLive ? "medium" : "info",
        publishedAt: game.startTimeUTC
          ? new Date(game.startTimeUTC).toISOString()
          : new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}
