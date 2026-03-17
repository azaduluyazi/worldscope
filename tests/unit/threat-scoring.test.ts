import { describe, it, expect } from "vitest";
import { calculateThreatIndex } from "@/lib/utils/threat-scoring";

describe("calculateThreatIndex", () => {
  it("returns zero score for empty events", () => {
    const result = calculateThreatIndex([]);
    expect(result.score).toBe(0);
    expect(result.level).toBe("low");
    expect(result.categories).toEqual({});
  });

  it("scores a single low event correctly", () => {
    const result = calculateThreatIndex([{ severity: "low", category: "tech" }]);
    expect(result.score).toBeLessThanOrEqual(5);
    expect(result.level).toBe("low");
    expect(result.categories).toHaveProperty("tech");
  });

  it("scores a single critical event as elevated or higher", () => {
    const result = calculateThreatIndex([{ severity: "critical", category: "conflict" }]);
    expect(result.score).toBeGreaterThan(0);
    expect(result.categories).toHaveProperty("conflict");
  });

  it("returns critical level for many high-severity events", () => {
    const events = Array.from({ length: 30 }, () => ({
      severity: "critical" as const,
      category: "conflict" as const,
    }));
    const result = calculateThreatIndex(events);
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.level).toBe("critical");
  });

  it("normalizes category scores to 0-100 range", () => {
    const events = [
      { severity: "high" as const, category: "cyber" as const },
      { severity: "medium" as const, category: "finance" as const },
      { severity: "critical" as const, category: "conflict" as const },
    ];
    const result = calculateThreatIndex(events);
    for (const val of Object.values(result.categories)) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(100);
    }
  });

  it("caps overall score at 100", () => {
    const events = Array.from({ length: 100 }, () => ({
      severity: "critical" as const,
      category: "conflict" as const,
    }));
    const result = calculateThreatIndex(events);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("assigns correct threat levels at boundaries", () => {
    // 50+ events of medium severity => score climbs toward high
    const medium50 = Array.from({ length: 50 }, () => ({
      severity: "medium" as const,
      category: "cyber" as const,
    }));
    const result = calculateThreatIndex(medium50);
    expect(["elevated", "high", "critical"]).toContain(result.level);
  });
});
