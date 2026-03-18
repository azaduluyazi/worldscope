import { describe, it, expect } from "vitest";
import { detectAnomalies } from "@/lib/utils/anomaly-detection";
import { extractEntities } from "@/lib/utils/entity-extraction";
import { analyzeSentiment } from "@/lib/utils/sentiment-analysis";
import type { IntelItem } from "@/types/intel";

function makeItem(overrides: Partial<IntelItem> = {}): IntelItem {
  return {
    id: `test-${Math.random().toString(36).slice(2)}`,
    title: "Test Event",
    summary: "Summary text",
    url: "https://example.com",
    source: "TestSource",
    category: "conflict",
    severity: "medium",
    publishedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("detectAnomalies", () => {
  it("returns empty for no items", () => {
    expect(detectAnomalies([], 24, 6)).toEqual([]);
  });

  it("detects category spike", () => {
    const now = Date.now();
    // Baseline: 2 conflict events spread over 18h
    const baseline = [
      makeItem({ category: "conflict", publishedAt: new Date(now - 12 * 3600000).toISOString() }),
      makeItem({ category: "conflict", publishedAt: new Date(now - 15 * 3600000).toISOString() }),
    ];
    // Current: 8 conflict events in last 6h (spike)
    const current = Array.from({ length: 8 }, (_, i) =>
      makeItem({ category: "conflict", publishedAt: new Date(now - i * 1800000).toISOString() })
    );

    const anomalies = detectAnomalies([...current, ...baseline], 24, 6);
    const spike = anomalies.find((a) => a.type === "spike");
    expect(spike).toBeDefined();
  });

  it("limits results to 10", () => {
    const items = Array.from({ length: 200 }, () => makeItem());
    const anomalies = detectAnomalies(items, 24, 6);
    expect(anomalies.length).toBeLessThanOrEqual(10);
  });
});

describe("extractEntities", () => {
  it("extracts organizations from titles", () => {
    const items = [
      makeItem({ title: "NATO deploys forces to eastern border" }),
      makeItem({ title: "NATO and EU discuss defense strategy" }),
      makeItem({ title: "UN calls for ceasefire in conflict zone" }),
    ];
    const entities = extractEntities(items);
    const nato = entities.find((e) => e.name === "NATO");
    expect(nato).toBeDefined();
    expect(nato!.count).toBeGreaterThanOrEqual(2);
    expect(nato!.type).toBe("organization");
  });

  it("extracts locations", () => {
    const items = [
      makeItem({ title: "Tensions rise in Gaza as conflict intensifies" }),
      makeItem({ title: "Gaza humanitarian crisis deepens" }),
    ];
    const entities = extractEntities(items);
    const gaza = entities.find((e) => e.name === "Gaza");
    expect(gaza).toBeDefined();
    expect(gaza!.type).toBe("location");
  });

  it("extracts event types", () => {
    const items = [
      makeItem({ title: "Major earthquake strikes coastal region" }),
    ];
    const entities = extractEntities(items);
    const quake = entities.find((e) => e.name.toLowerCase().includes("earthquake"));
    expect(quake).toBeDefined();
    expect(quake!.type).toBe("event");
  });

  it("limits results", () => {
    const items = Array.from({ length: 50 }, () =>
      makeItem({ title: "NATO EU UN WHO IMF FBI CIA NSA IAEA OPEC event" })
    );
    const entities = extractEntities(items, 5);
    expect(entities.length).toBeLessThanOrEqual(5);
  });
});

describe("analyzeSentiment", () => {
  it("returns neutral for empty items", () => {
    const result = analyzeSentiment([]);
    expect(result.overall).toBe("neutral");
    expect(result.score).toBe(0);
  });

  it("detects negative sentiment from conflict words", () => {
    const items = [
      makeItem({ title: "Deadly attack kills dozens in bombing" }),
      makeItem({ title: "War escalates as violence spreads" }),
      makeItem({ title: "Crisis deepens after terrorist assault" }),
    ];
    const result = analyzeSentiment(items);
    expect(result.overall).toBe("negative");
    expect(result.score).toBeLessThan(0);
    expect(result.distribution.negative).toBeGreaterThan(0);
  });

  it("detects positive sentiment from peace words", () => {
    const items = [
      makeItem({ title: "Peace agreement reached after summit" }),
      makeItem({ title: "Breakthrough innovation launches recovery" }),
      makeItem({ title: "Growth and progress in reform efforts" }),
    ];
    const result = analyzeSentiment(items);
    expect(result.overall).toBe("positive");
    expect(result.score).toBeGreaterThan(0);
  });

  it("returns distribution totaling item count", () => {
    const items = [makeItem(), makeItem(), makeItem(), makeItem(), makeItem()];
    const result = analyzeSentiment(items);
    const total = result.distribution.negative + result.distribution.neutral + result.distribution.positive;
    expect(total).toBe(5);
  });
});
