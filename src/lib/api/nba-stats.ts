/**
 * NBA Stats API — Player stats, standings, box scores.
 * Free, no API key required. Uses balldontlie.io (public).
 * Source: swar/nba_api (3524 stars) pattern adapted for TypeScript.
 * Complements ESPN live scores with detailed player/team stats.
 */

import type { IntelItem } from "@/types/intel";

// ESPN NBA scoreboard (already proven in espn-sports.ts)
const ESPN_NBA = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";

// NBA types reserved for balldontlie.io API migration
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _NbaStanding {
  team: { full_name: string; abbreviation: string; conference: string; division: string };
  wins: number;
  losses: number;
  pct: number;
  conference_rank: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _NbaGame {
  id: number;
  date: string;
  home_team: { full_name: string; abbreviation: string };
  visitor_team: { full_name: string; abbreviation: string };
  home_team_score: number;
  visitor_team_score: number;
  status: string;
}

/**
 * Fetch NBA standings via ESPN (more reliable, no key needed).
 */
export async function fetchNbaStandings(): Promise<IntelItem[]> {
  try {
    const res = await fetch(`${ESPN_NBA}/standings`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const groups = data?.children || [];
    const items: IntelItem[] = [];

    for (const conf of groups) {
      const confName = conf.name || "Conference";
      const standings = conf.standings?.entries || [];
      if (standings.length < 3) continue;

      const top5 = standings.slice(0, 5).map(
        (s: { team: { displayName: string }; stats: Array<{ value: string; name: string }> }, i: number) => {
          const wins = s.stats?.find((st: { name: string }) => st.name === "wins")?.value || "0";
          const losses = s.stats?.find((st: { name: string }) => st.name === "losses")?.value || "0";
          return `${i + 1}. ${s.team.displayName} (${wins}-${losses})`;
        }
      ).join(" | ");

      items.push({
        id: `nba-standings-${confName.toLowerCase()}-${Date.now()}`,
        title: `🏀 NBA ${confName}: ${standings[0]?.team?.displayName || "TBD"} leads`,
        summary: top5,
        url: "https://www.espn.com/nba/standings",
        source: "NBA Stats",
        category: "sports",
        severity: "info",
        publishedAt: new Date().toISOString(),
      });
    }

    return items;
  } catch {
    return [];
  }
}

/**
 * Fetch today's NBA games via ESPN scoreboard.
 */
export async function fetchNbaToday(): Promise<IntelItem[]> {
  try {
    const res = await fetch(`${ESPN_NBA}/scoreboard`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const events = data?.events || [];
    if (events.length === 0) return [];

    const items: IntelItem[] = [];
    const liveCount = events.filter(
      (e: { status: { type: { state: string } } }) => e.status.type.state === "in"
    ).length;

    // Summary card
    if (events.length > 0) {
      items.push({
        id: `nba-today-${Date.now()}`,
        title: `🏀 NBA Today: ${events.length} games${liveCount > 0 ? ` (${liveCount} LIVE)` : ""}`,
        summary: events.slice(0, 5).map((e: { shortName: string; status: { type: { description: string } } }) =>
          `${e.shortName} (${e.status.type.description})`
        ).join(" | "),
        url: "https://www.espn.com/nba/scoreboard",
        source: "NBA Stats",
        category: "sports",
        severity: liveCount > 0 ? "high" : "info",
        publishedAt: new Date().toISOString(),
      });
    }

    return items;
  } catch {
    return [];
  }
}

/**
 * Fetch NBA playoff bracket / postseason info when available.
 */
export async function fetchNbaPlayoffs(): Promise<IntelItem[]> {
  try {
    const res = await fetch(`${ESPN_NBA}/news`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const articles = data?.articles || [];

    // Filter playoff-related news
    const playoffNews = articles.filter((a: { headline: string }) =>
      /playoff|finals|eliminat|sweep|series/i.test(a.headline || "")
    );

    return playoffNews.slice(0, 3).map((a: {
      dataSourceIdentifier?: string;
      headline?: string;
      description?: string;
      links?: { web?: { href?: string } };
      published?: string;
    }): IntelItem => ({
      id: `nba-playoff-${a.dataSourceIdentifier || Date.now()}`,
      title: `🏀 ${a.headline || "NBA Playoff Update"}`,
      summary: String(a.description || "").slice(0, 300),
      url: a.links?.web?.href || "https://www.espn.com/nba/playoffs",
      source: "NBA Stats",
      category: "sports",
      severity: "medium",
      publishedAt: a.published || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

/**
 * Combined NBA intel — standings + today's games + playoffs.
 */
export async function fetchNbaIntel(): Promise<IntelItem[]> {
  const [standings, today, playoffs] = await Promise.allSettled([
    fetchNbaStandings(),
    fetchNbaToday(),
    fetchNbaPlayoffs(),
  ]);

  return [
    ...(standings.status === "fulfilled" ? standings.value : []),
    ...(today.status === "fulfilled" ? today.value : []),
    ...(playoffs.status === "fulfilled" ? playoffs.value : []),
  ];
}
