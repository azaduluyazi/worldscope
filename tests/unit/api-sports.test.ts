import { describe, it, expect } from "vitest";

interface SportsEvent {
  id: string;
  sport: string;
  league: string;
  title: string;
  status: "scheduled" | "live" | "completed" | "postponed";
  score?: string;
  startTime: string;
  source: string;
}

describe("Sports API data shape", () => {
  it("SportsEvent has all required fields", () => {
    const event: SportsEvent = {
      id: "espn-soccer-1",
      sport: "soccer",
      league: "Premier League",
      title: "Arsenal vs Chelsea",
      status: "live",
      score: "2-1",
      startTime: new Date().toISOString(),
      source: "espn",
    };
    expect(event.sport).toBeTruthy();
    expect(event.league).toBeTruthy();
    expect(["scheduled", "live", "completed", "postponed"]).toContain(event.status);
  });

  it("status mapping works for ESPN statuses", () => {
    const mapStatus = (s: string): SportsEvent["status"] => {
      const lower = s.toLowerCase();
      if (lower.includes("final") || lower.includes("end") || lower.includes("complete")) return "completed";
      if (lower.includes("postpone") || lower.includes("cancel")) return "postponed";
      if (lower.includes("_in_") || lower.includes("live") || lower.includes("progress")) return "live";
      return "scheduled";
    };
    expect(mapStatus("STATUS_IN_PROGRESS")).toBe("live");
    expect(mapStatus("STATUS_FINAL")).toBe("completed");
    expect(mapStatus("STATUS_POSTPONED")).toBe("postponed");
    expect(mapStatus("STATUS_SCHEDULED")).toBe("scheduled");
  });
});
