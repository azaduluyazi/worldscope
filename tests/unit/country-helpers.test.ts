import { describe, it, expect } from "vitest";
import { getFlagEmoji, getRegionCountries, getNeighborCountries, computeCountryThreat } from "@/lib/utils/country-helpers";

describe("getFlagEmoji", () => {
  it("converts TR to Turkish flag", () => {
    expect(getFlagEmoji("TR")).toBe("🇹🇷");
  });
  it("converts US to American flag", () => {
    expect(getFlagEmoji("US")).toBe("🇺🇸");
  });
  it("handles lowercase input", () => {
    expect(getFlagEmoji("tr")).toBe("🇹🇷");
  });
});

describe("getRegionCountries", () => {
  it("returns only Middle East countries for that region", () => {
    const result = getRegionCountries("Middle East");
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((c) => c.region === "Middle East")).toBe(true);
  });
  it("returns empty array for unknown region", () => {
    expect(getRegionCountries("Mars")).toEqual([]);
  });
});

describe("getNeighborCountries", () => {
  it("returns prev and next in same region", () => {
    const { prev, next } = getNeighborCountries("IL");
    expect(prev).toBeDefined();
    expect(next).toBeDefined();
    expect(prev!.region).toBe("Middle East");
    expect(next!.region).toBe("Middle East");
  });
  it("wraps around at region boundaries", () => {
    const { prev } = getNeighborCountries("TR");
    expect(prev).toBeDefined();
  });
});

describe("computeCountryThreat", () => {
  it("returns 0 for empty events", () => {
    expect(computeCountryThreat([])).toBe(0);
  });
  it("returns higher score for critical events", () => {
    const critical = computeCountryThreat([
      { severity: "critical" }, { severity: "critical" },
    ]);
    const low = computeCountryThreat([
      { severity: "low" }, { severity: "low" },
    ]);
    expect(critical).toBeGreaterThan(low);
  });
  it("caps at 100", () => {
    const events = Array.from({ length: 100 }, () => ({ severity: "critical" as const }));
    expect(computeCountryThreat(events)).toBeLessThanOrEqual(100);
  });
});
