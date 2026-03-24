/**
 * Cricket Data — Live scores and match results.
 * Free, no API key. Uses ESPN Cricinfo API (public).
 * Source: THOMASBAIJU/Batsman_Bowler_Matchup pattern.
 * Gap: Zero cricket coverage in current SportsScope.
 */

import type { IntelItem } from "@/types/intel";

const CRICINFO_API = "https://site.api.espn.com/apis/site/v2/sports/cricket";

/**
 * Fetch live/recent international cricket scores.
 */
export async function fetchCricketScores(): Promise<IntelItem[]> {
  try {
    // International matches
    const res = await fetch(`${CRICINFO_API}/scoreboard`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const events = data?.events || [];

    return events.slice(0, 10).map((e: {
      id: string;
      name: string;
      shortName: string;
      date: string;
      status: { type: { state: string; description: string } };
      competitions: Array<{
        competitors: Array<{
          team: { displayName: string; abbreviation: string };
          score: string;
          winner?: boolean;
        }>;
      }>;
      links?: Array<{ href: string }>;
    }): IntelItem => {
      const state = e.status.type.state;
      const comp = e.competitions?.[0];
      const teams = comp?.competitors || [];

      let title = e.shortName || e.name;
      if (state === "in") {
        title = `🔴 LIVE: ${e.shortName} — ${teams.map(t => `${t.team.abbreviation} ${t.score || ""}`).join(" vs ")}`;
      } else if (state === "post") {
        const winner = teams.find(t => t.winner);
        title = `🏏 ${winner?.team.displayName || "TBD"} wins | ${e.shortName}`;
      }

      return {
        id: `cricket-${e.id}`,
        title,
        summary: `${e.name} | ${e.status.type.description}`,
        url: e.links?.[0]?.href || "https://www.espncricinfo.com",
        source: "Cricinfo",
        category: "sports",
        severity: state === "in" ? "high" : state === "post" ? "medium" : "info",
        publishedAt: e.date,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Fetch cricket news headlines.
 */
export async function fetchCricketNews(): Promise<IntelItem[]> {
  try {
    const res = await fetch(`${CRICINFO_API}/news`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const articles = data?.articles || [];

    return articles.slice(0, 5).map((a: {
      dataSourceIdentifier?: string;
      headline?: string;
      description?: string;
      links?: { web?: { href?: string } };
      published?: string;
    }): IntelItem => ({
      id: `cricket-news-${a.dataSourceIdentifier || Date.now()}`,
      title: `🏏 ${a.headline || "Cricket Update"}`,
      summary: String(a.description || "").slice(0, 300),
      url: a.links?.web?.href || "https://www.espncricinfo.com",
      source: "Cricinfo",
      category: "sports",
      severity: "info",
      publishedAt: a.published || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

/**
 * Combined Cricket intel.
 */
export async function fetchCricketIntel(): Promise<IntelItem[]> {
  const [scores, news] = await Promise.allSettled([
    fetchCricketScores(),
    fetchCricketNews(),
  ]);

  return [
    ...(scores.status === "fulfilled" ? scores.value : []),
    ...(news.status === "fulfilled" ? news.value : []),
  ];
}
