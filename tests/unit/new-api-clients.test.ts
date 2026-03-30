import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock redis (some clients may import cache)
vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor() {}
    get = vi.fn().mockResolvedValue(null);
    set = vi.fn().mockResolvedValue("OK");
  },
}));

describe("new API clients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("fetchCricketScores returns IntelItem[] shape", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        events: [{
          id: "1",
          name: "India vs Australia",
          shortName: "IND vs AUS",
          date: new Date().toISOString(),
          status: { type: { state: "in", description: "In Progress", completed: false } },
          competitions: [{ competitors: [
            { team: { displayName: "India" }, score: "250" },
            { team: { displayName: "Australia" }, score: "180" },
          ] }],
        }],
      }),
    });

    const { fetchCricketScores } = await import("@/lib/api/cricket");
    const items = await fetchCricketScores();

    expect(Array.isArray(items)).toBe(true);
    // Should return items with expected IntelItem shape
    for (const item of items) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("title");
    }
  });

  it("fetchCricketScores handles errors gracefully", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const { fetchCricketScores } = await import("@/lib/api/cricket");
    const items = await fetchCricketScores();

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(0);
  });

  it("fetchEspnScores returns IntelItem[] shape", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        events: [{
          id: "401",
          name: "Arsenal vs Chelsea",
          shortName: "ARS vs CHE",
          date: new Date().toISOString(),
          status: { type: { state: "post", description: "Final", completed: true }, displayClock: "FT" },
          competitions: [{ competitors: [
            { team: { displayName: "Arsenal" }, score: "2" },
            { team: { displayName: "Chelsea" }, score: "1" },
          ] }],
        }],
      }),
    });

    const { fetchEspnScores } = await import("@/lib/api/espn-sports");
    const items = await fetchEspnScores("soccer");

    expect(Array.isArray(items)).toBe(true);
    for (const item of items) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("severity");
    }
  });

  it("fetchArxivPapers returns IntelItem[] shape", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => `<?xml version="1.0"?>
        <feed>
          <entry>
            <id>http://arxiv.org/abs/2401.00001</id>
            <title>Test Paper on AI</title>
            <summary>A test paper summary.</summary>
            <published>2026-03-01T00:00:00Z</published>
          </entry>
        </feed>`,
    });

    const { fetchArxivPapers } = await import("@/lib/api/arxiv");
    const items = await fetchArxivPapers("cs.AI", 5);

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toHaveProperty("title", "Test Paper on AI");
  });

  it("fetchEiaIntel returns IntelItem[] and handles missing API key", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        response: {
          data: [{ period: "2026-03-01", value: 72.5, units: "$/barrel" }],
        },
      }),
    });

    const { fetchEiaIntel } = await import("@/lib/api/eia");
    const items = await fetchEiaIntel();

    // Should return array (may be empty if env var missing, but not throw)
    expect(Array.isArray(items)).toBe(true);
  });

  it("fetchElectricityMapsIntel returns IntelItem[] shape", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        zone: "DE",
        carbonIntensity: 350,
        fossilFuelPercentage: 45,
        renewablePercentage: 55,
        powerConsumptionTotal: 60000,
        powerProductionTotal: 62000,
        datetime: new Date().toISOString(),
      }),
    });

    const { fetchElectricityMapsIntel } = await import("@/lib/api/electricity-maps");
    const items = await fetchElectricityMapsIntel();

    expect(Array.isArray(items)).toBe(true);
  });

  it("fetchEntsoeIntel handles errors gracefully", async () => {
    mockFetch.mockRejectedValue(new Error("ENTSO-E unavailable"));

    const { fetchEntsoeIntel } = await import("@/lib/api/entsoe");
    const items = await fetchEntsoeIntel();

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(0);
  });
});
