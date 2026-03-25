/**
 * TheSportsDB — Daily Live Scores & Events.
 * Source: https://www.thesportsdb.com/api/v1/json/3/eventsday.php
 * No API key required (free tier uses key "3").
 */

import type { IntelItem } from "@/types/intel";

interface SportsDbEvent {
  idEvent?: string;
  strEvent?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strSport?: string;
  strLeague?: string;
  strVenue?: string;
  dateEvent?: string;
  strTime?: string;
}

interface SportsDbResponse {
  events: SportsDbEvent[] | null;
}

export async function fetchTheSportsDb(): Promise<IntelItem[]> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${today}`,
      { signal: AbortSignal.timeout(10000), next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const data: SportsDbResponse = await res.json();
    const events = data.events || [];

    return events.slice(0, 20).map((ev, idx) => {
      const home = ev.strHomeTeam || "Home";
      const away = ev.strAwayTeam || "Away";
      const scoreHome = ev.intHomeScore ?? "-";
      const scoreAway = ev.intAwayScore ?? "-";
      const hasScore =
        ev.intHomeScore !== null &&
        ev.intHomeScore !== undefined &&
        ev.intAwayScore !== null &&
        ev.intAwayScore !== undefined;

      const title = hasScore
        ? `${home} ${scoreHome} - ${scoreAway} ${away}`
        : `${home} vs ${away}`;

      return {
        id: `thesportsdb-${ev.idEvent || idx}-${idx}`,
        title,
        summary: `${ev.strSport || "Sport"} | ${ev.strLeague || "League"}${ev.strVenue ? " | " + ev.strVenue : ""}`,
        url: `https://www.thesportsdb.com/event/${ev.idEvent}`,
        source: "TheSportsDB",
        category: "sports" as const,
        severity: "info" as const,
        publishedAt: ev.dateEvent
          ? new Date(ev.dateEvent + (ev.strTime ? "T" + ev.strTime : "T00:00:00")).toISOString()
          : new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}
