/**
 * Cricket Data — Live scores and match results.
 * Free, no API key. Uses ESPN Cricinfo API (public).
 * ESPN cricket API requires league IDs in the path.
 */

import type { IntelItem } from "@/types/intel";

const CRICINFO_API = "https://site.api.espn.com/apis/site/v2/sports/cricket";

// Major cricket league IDs
const CRICKET_LEAGUES = [
  { id: 28431, name: "IPL" },
  { id: 8043, name: "Sheffield Shield" },
  { id: 8041, name: "SuperSport" },
  { id: 8039, name: "ICC WTC" },
  { id: 28880, name: "Big Bash" },
  { id: 28129, name: "The Hundred" },
];

/**
 * Fetch live/recent international cricket scores.
 */
export async function fetchCricketScores(): Promise<IntelItem[]> {
  try {
    const allEvents: Array<Record<string, unknown>> = [];

    // Fetch from multiple leagues in parallel
    const results = await Promise.allSettled(
      CRICKET_LEAGUES.map(async (league) => {
        const res = await fetch(`${CRICINFO_API}/${league.id}/scoreboard`, {
          signal: AbortSignal.timeout(5000),
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data?.events || []) as Array<Record<string, unknown>>;
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") allEvents.push(...r.value);
    }

    return allEvents.slice(0, 10).map((e): IntelItem => {
      const state = (e.status as { type: { state: string; description: string } })?.type?.state || "";
      const comp = (e.competitions as Array<{ competitors: Array<{ team: { displayName: string; abbreviation: string }; score: string; winner?: boolean }> }>)?.[0];
      const teams = comp?.competitors || [];
      const shortName = String(e.shortName || e.name || "");

      let title = shortName;
      if (state === "in") {
        title = `🔴 LIVE: ${shortName} — ${teams.map(t => `${t.team.abbreviation} ${t.score || ""}`).join(" vs ")}`;
      } else if (state === "post") {
        const winner = teams.find(t => t.winner);
        title = `🏏 ${winner?.team.displayName || "TBD"} wins | ${shortName}`;
      }

      return {
        id: `cricket-${e.id}`,
        title,
        summary: `${e.name} | ${(e.status as { type: { description: string } })?.type?.description || ""}`,
        url: ((e.links as Array<{ href: string }>)?.[0]?.href) || "https://www.espncricinfo.com",
        source: "Cricinfo",
        category: "sports",
        severity: state === "in" ? "high" : state === "post" ? "medium" : "info",
        publishedAt: String(e.date || new Date().toISOString()),
      };
    });
  } catch {
    return [];
  }
}

/**
 * Combined Cricket intel.
 */
export async function fetchCricketIntel(): Promise<IntelItem[]> {
  return fetchCricketScores();
}
