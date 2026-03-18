import { describe, it, expect } from "vitest";
import { computeAnalytics } from "@/hooks/useAnalytics";
import type { IntelItem } from "@/types/intel";

function makeItem(overrides: Partial<IntelItem> = {}): IntelItem {
  return {
    id: `test-${Math.random().toString(36).slice(2)}`,
    title: "Test Event",
    summary: "Summary",
    url: "https://example.com",
    source: "TestSource",
    category: "conflict",
    severity: "medium",
    publishedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("computeAnalytics", () => {
  it("returns zero stats for empty items", () => {
    const result = computeAnalytics([], 24);
    expect(result.totalEvents).toBe(0);
    expect(result.uniqueSources).toBe(0);
    expect(result.avgPerHour).toBe(0);
    expect(result.categoryCounts).toEqual([]);
    expect(result.topSources).toEqual([]);
  });

  it("counts total events correctly", () => {
    const items = [makeItem(), makeItem(), makeItem()];
    const result = computeAnalytics(items, 24);
    expect(result.totalEvents).toBe(3);
  });

  it("counts unique sources", () => {
    const items = [
      makeItem({ source: "Reuters" }),
      makeItem({ source: "BBC" }),
      makeItem({ source: "Reuters" }),
    ];
    const result = computeAnalytics(items, 24);
    expect(result.uniqueSources).toBe(2);
  });

  it("ranks categories by count descending", () => {
    const items = [
      makeItem({ category: "cyber" }),
      makeItem({ category: "conflict" }),
      makeItem({ category: "conflict" }),
      makeItem({ category: "conflict" }),
      makeItem({ category: "cyber" }),
    ];
    const result = computeAnalytics(items, 24);
    expect(result.categoryCounts[0].category).toBe("conflict");
    expect(result.categoryCounts[0].count).toBe(3);
    expect(result.categoryCounts[1].category).toBe("cyber");
    expect(result.categoryCounts[1].count).toBe(2);
  });

  it("computes geo rate correctly", () => {
    const items = [
      makeItem({ lat: 40, lng: 30 }),
      makeItem({ lat: 35, lng: 45 }),
      makeItem({}),
    ];
    const result = computeAnalytics(items, 24);
    expect(result.geoRate).toBe(67); // 2/3 = 66.67 → rounds to 67
  });

  it("computes avgPerHour", () => {
    const items = Array.from({ length: 48 }, () => makeItem());
    const result = computeAnalytics(items, 24);
    expect(result.avgPerHour).toBe(2);
  });

  it("limits top sources to 10", () => {
    const items = Array.from({ length: 15 }, (_, i) =>
      makeItem({ source: `Source-${i}` })
    );
    const result = computeAnalytics(items, 24);
    expect(result.topSources.length).toBe(10);
  });

  it("creates severity buckets", () => {
    const items = [makeItem({ severity: "critical" })];
    const result = computeAnalytics(items, 24);
    expect(result.severityBuckets.length).toBeGreaterThan(0);
    // At least one bucket should have a critical count
    const totalCritical = result.severityBuckets.reduce((s, b) => s + b.critical, 0);
    expect(totalCritical).toBe(1);
  });

  it("detects geo hotspots", () => {
    const items = [
      makeItem({ lat: 40, lng: 30 }),
      makeItem({ lat: 41, lng: 31 }),
      makeItem({ lat: 39, lng: 29 }),
    ];
    const result = computeAnalytics(items, 24);
    expect(result.geoHotspots.length).toBeGreaterThan(0);
    expect(result.geoHotspots[0].count).toBe(3); // all round to same 10° grid
  });
});
