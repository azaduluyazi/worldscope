import { describe, it, expect } from "vitest";
import { detectTrends } from "@/lib/utils/trend-detection";
import type { IntelItem } from "@/types/intel";

/** Helper: create a fake IntelItem at a given hours-ago offset */
function makeItem(
  overrides: Partial<IntelItem> & { hoursAgo: number }
): IntelItem {
  const { hoursAgo, ...rest } = overrides;
  return {
    id: `test-${Math.random().toString(36).slice(2)}`,
    title: "Test event",
    summary: "",
    url: "",
    source: "TestSource",
    category: "conflict",
    severity: "medium",
    publishedAt: new Date(Date.now() - hoursAgo * 3600_000).toISOString(),
    ...rest,
  };
}

describe("detectTrends", () => {
  it("returns empty trends for no items", () => {
    const result = detectTrends([]);
    expect(result.risingCategories).toEqual([]);
    expect(result.newSources).toEqual([]);
    expect(result.hotRegions).toEqual([]);
    expect(result.severityEscalation.escalating).toBe(false);
  });

  it("detects rising category when current > previous by 20%+", () => {
    const items = [
      // Current period: 3 conflict events (within last 12h)
      makeItem({ hoursAgo: 1, category: "conflict" }),
      makeItem({ hoursAgo: 2, category: "conflict" }),
      makeItem({ hoursAgo: 3, category: "conflict" }),
      // Previous period: 1 conflict event (12-24h ago)
      makeItem({ hoursAgo: 15, category: "conflict" }),
    ];

    const result = detectTrends(items, 12);
    expect(result.risingCategories.length).toBeGreaterThan(0);
    expect(result.risingCategories[0].category).toBe("conflict");
    expect(result.risingCategories[0].changePct).toBe(200); // 3 vs 1 = +200%
  });

  it("does not flag category with <2 current items", () => {
    const items = [
      makeItem({ hoursAgo: 1, category: "cyber" }),
      makeItem({ hoursAgo: 20, category: "cyber" }), // previous: 0 → not enough current
    ];

    // Only 1 current cyber event — should not flag
    const result = detectTrends(items, 12);
    // Filter: changePct > 20 && current >= 2
    const cyberRising = result.risingCategories.find((r) => r.category === "cyber");
    expect(cyberRising).toBeUndefined();
  });

  it("detects severity escalation", () => {
    const items = [
      // Current: 3 critical
      makeItem({ hoursAgo: 1, severity: "critical" }),
      makeItem({ hoursAgo: 2, severity: "critical" }),
      makeItem({ hoursAgo: 3, severity: "critical" }),
      // Previous: 3 low
      makeItem({ hoursAgo: 15, severity: "low" }),
      makeItem({ hoursAgo: 16, severity: "low" }),
      makeItem({ hoursAgo: 17, severity: "low" }),
    ];

    const result = detectTrends(items, 12);
    expect(result.severityEscalation.escalating).toBe(true);
    expect(result.severityEscalation.currentCriticalPct).toBe(100);
    expect(result.severityEscalation.previousCriticalPct).toBe(0);
  });

  it("detects new sources", () => {
    const items = [
      makeItem({ hoursAgo: 1, source: "NewSource" }),
      makeItem({ hoursAgo: 15, source: "OldSource" }),
    ];

    const result = detectTrends(items, 12);
    expect(result.newSources).toContain("NewSource");
    expect(result.newSources).not.toContain("OldSource");
  });

  it("detects hot regions with 3+ events in same geo bin", () => {
    const items = [
      // All round to 30°N, 30°E bin (Math.round(x/10)*10)
      makeItem({ hoursAgo: 1, lat: 31.0, lng: 32.0 }),
      makeItem({ hoursAgo: 2, lat: 29.0, lng: 28.0 }),
      makeItem({ hoursAgo: 3, lat: 33.0, lng: 31.0 }),
    ];

    const result = detectTrends(items, 12);
    expect(result.hotRegions.length).toBeGreaterThan(0);
    expect(result.hotRegions[0].count).toBeGreaterThanOrEqual(3);
  });

  it("limits hot regions to top 5", () => {
    // Create 7 distinct geo clusters with 3+ events each
    const items: IntelItem[] = [];
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 4; j++) {
        items.push(makeItem({ hoursAgo: 1, lat: i * 15, lng: i * 15 }));
      }
    }

    const result = detectTrends(items, 12);
    expect(result.hotRegions.length).toBeLessThanOrEqual(5);
  });
});
