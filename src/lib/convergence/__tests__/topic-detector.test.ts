import { describe, expect, it, beforeEach, vi } from "vitest";
import type { IntelItem } from "@/types/intel";
import { detectTopicCorrelations } from "../topic-detector";
import { setEmbeddingProvider } from "../embedding";
import type { EmbeddingProvider } from "../embedding/provider";

// ═══════════════════════════════════════════════════════════════════
//  topic-detector tests
// ═══════════════════════════════════════════════════════════════════
//
//  The detector depends on computeEventEmbeddings which calls Gemini
//  via the embedding provider singleton. We inject a MOCK provider
//  that returns deterministic vectors based on event title content,
//  so tests stay hermetic and don't need network/API keys.
//
//  Mock strategy:
//    - Each test defines a map: title substring → unit vector
//    - Mock provider returns the matching vector (or orthogonal zero)
//    - Tests can then assert semantic clustering behavior precisely
//
//  This is how you test "semantic" logic without real embeddings.
// ═══════════════════════════════════════════════════════════════════

// Fixed "now" for all tests — eliminates time-based flakiness
const NOW = new Date("2026-04-08T12:00:00Z").getTime();

function iso(offsetMinutes = 0): string {
  return new Date(NOW + offsetMinutes * 60_000).toISOString();
}

function makeItem(opts: Partial<IntelItem> & Pick<IntelItem, "id" | "category" | "title">): IntelItem {
  return {
    id: opts.id,
    title: opts.title,
    summary: opts.summary ?? "",
    url: opts.url ?? `https://test.example/${opts.id}`,
    source: opts.source ?? "Reddit r/worldnews",
    category: opts.category,
    severity: opts.severity ?? "medium",
    publishedAt: opts.publishedAt ?? iso(-5),
    // Deliberately no lat/lng — topic detector only sees geo-sparse items
    lat: opts.lat,
    lng: opts.lng,
  };
}

/**
 * Mock embedding provider. Maps title keywords to unit vectors so
 * tests can control which events are "semantically similar".
 *
 * Default layout (3D for simplicity):
 *   - "iran"     → [1, 0, 0]
 *   - "israel"   → [0.95, 0.3, 0]  (very similar to iran — shared topic)
 *   - "ukraine"  → [0, 1, 0]       (orthogonal to iran)
 *   - "russia"   → [0.1, 0.98, 0]  (very similar to ukraine)
 *   - "weather"  → [0, 0, 1]       (orthogonal to both)
 *   - default    → [0.33, 0.33, 0.33]
 */
function makeMockProvider(): EmbeddingProvider {
  const keywordVectors: Array<{ pattern: RegExp; vec: number[] }> = [
    { pattern: /iran|tehran|persia/i, vec: [1, 0, 0] },
    { pattern: /israel|israeli|gaza/i, vec: [0.95, 0.31, 0] },
    { pattern: /ukraine|kyiv/i, vec: [0, 1, 0] },
    { pattern: /russia|moscow|putin/i, vec: [0.1, 0.995, 0] },
    { pattern: /weather|storm|hurricane/i, vec: [0, 0, 1] },
  ];
  const defaultVec = [0.577, 0.577, 0.577]; // orthogonal-ish

  function embedOne(text: string): number[] {
    for (const { pattern, vec } of keywordVectors) {
      if (pattern.test(text)) return vec;
    }
    return defaultVec;
  }

  return {
    name: "mock",
    dimensions: 3,
    async embed(text: string) {
      return embedOne(text);
    },
    async embedBatch(texts: string[]) {
      return texts.map(embedOne);
    },
  };
}

// The topic-detector imports fetchExistingEmbeddings from db/convergence-embeddings
// which reaches Supabase. In tests we stub that module to return an empty map
// so the detector always goes through the mock provider.
vi.mock("@/lib/db/convergence-embeddings", () => ({
  fetchExistingEmbeddings: vi.fn(async () => new Map()),
  storeEmbeddings: vi.fn(async () => 0),
  findSimilarEmbeddings: vi.fn(async () => []),
  purgeOrphanedEmbeddings: vi.fn(async () => 0),
}));

describe("detectTopicCorrelations", () => {
  beforeEach(() => {
    setEmbeddingProvider(makeMockProvider());
    vi.setSystemTime(new Date(NOW));
  });

  it("returns empty when there are fewer than 2 non-geo items", async () => {
    const items = [
      makeItem({ id: "a", category: "conflict", title: "Iran news" }),
    ];
    const result = await detectTopicCorrelations(items);
    expect(result).toEqual([]);
  });

  it("skips events that have lat/lng (those belong to the geo track)", async () => {
    const items = [
      makeItem({ id: "a", category: "conflict", title: "Iran crisis", lat: 32.4, lng: 53.7 }),
      makeItem({ id: "b", category: "finance", title: "Iran oil sanctions" }),
      makeItem({ id: "c", category: "diplomacy", title: "Iran talks resume" }),
    ];
    const result = await detectTopicCorrelations(items);
    // Only b + c are eligible (both non-geo, both about Iran, different cats)
    expect(result).toHaveLength(1);
    expect(result[0].events).toHaveLength(2);
    expect(result[0].events.map((e) => e.eventId).sort()).toEqual(["b", "c"]);
  });

  it("clusters semantically similar events from DIFFERENT categories", async () => {
    const items = [
      makeItem({ id: "1", category: "conflict", title: "Iran strike news", publishedAt: iso(-30) }),
      makeItem({ id: "2", category: "finance", title: "Iran oil prices spike", publishedAt: iso(-20) }),
      makeItem({ id: "3", category: "diplomacy", title: "Israel responds to Iran", publishedAt: iso(-10) }),
    ];
    const result = await detectTopicCorrelations(items);
    expect(result.length).toBeGreaterThanOrEqual(1);
    const cluster = result[0];
    const cats = new Set(cluster.events.map((e) => e.category));
    expect(cats.size).toBeGreaterThanOrEqual(2);
  });

  it("does NOT cluster single-category agreement (needs cross-category)", async () => {
    const items = [
      makeItem({ id: "1", category: "conflict", title: "Iran news A" }),
      makeItem({ id: "2", category: "conflict", title: "Iran news B" }),
      makeItem({ id: "3", category: "conflict", title: "Iran news C" }),
    ];
    const result = await detectTopicCorrelations(items);
    expect(result).toEqual([]);
  });

  it("does NOT cluster semantically distant events even in different categories", async () => {
    const items = [
      makeItem({ id: "1", category: "conflict", title: "Iran crisis" }),
      makeItem({ id: "2", category: "natural", title: "Hurricane warning" }),
    ];
    const result = await detectTopicCorrelations(items);
    // Orthogonal vectors → similarity 0 → no cluster
    expect(result).toEqual([]);
  });

  it("respects category-aware time windows (same-category events too far apart)", async () => {
    // Two finance events 75 minutes apart. Finance window is 30 min.
    // With NO cross-category bridge, the pair window is max(30, 30) =
    // 30 min, so the 75-min delta excludes them. Result: no cluster
    // (single-event clusters are filtered by MIN_TOPIC_EVENTS).
    //
    // Note: the pair window is MAX of the two categories involved,
    // so a cross-category bridge (conflict's 6h window) WOULD rescue
    // them — see the "semantic + heterogeneity" test above for that.
    const items = [
      makeItem({ id: "1", category: "finance", title: "Iran oil prices", publishedAt: iso(-80) }),
      makeItem({ id: "2", category: "finance", title: "Iran markets", publishedAt: iso(-5) }),
    ];
    const result = await detectTopicCorrelations(items);
    // Both rejected: (a) exceeds pair window, and (b) even if they
    // squeaked in, MIN_TOPIC_CATEGORIES=2 blocks single-category clusters.
    expect(result).toEqual([]);
  });

  it("marks every produced cluster with isTopic: true and sentinel centroid", async () => {
    const items = [
      makeItem({ id: "1", category: "conflict", title: "Iran strike" }),
      makeItem({ id: "2", category: "finance", title: "Iran oil" }),
    ];
    const result = await detectTopicCorrelations(items);
    expect(result.length).toBeGreaterThan(0);
    for (const cluster of result) {
      expect(cluster.isTopic).toBe(true);
      expect(cluster.centroid).toEqual({ lat: 0, lng: 0 });
    }
  });

  it("separates independent topic clusters (Iran story vs Ukraine story)", async () => {
    const items = [
      // Iran cluster
      makeItem({ id: "i1", category: "conflict", title: "Iran strike" }),
      makeItem({ id: "i2", category: "finance", title: "Iran oil" }),
      // Ukraine cluster
      makeItem({ id: "u1", category: "conflict", title: "Ukraine offensive" }),
      makeItem({ id: "u2", category: "diplomacy", title: "Russia response to Ukraine" }),
    ];
    const result = await detectTopicCorrelations(items);
    expect(result.length).toBe(2);
    // Make sure the two clusters don't share events
    const iranCluster = result.find((c) => c.events.some((e) => e.eventId === "i1"));
    const ukraineCluster = result.find((c) => c.events.some((e) => e.eventId === "u1"));
    expect(iranCluster).toBeDefined();
    expect(ukraineCluster).toBeDefined();
    const iranIds = new Set(iranCluster!.events.map((e) => e.eventId));
    const ukraineIds = new Set(ukraineCluster!.events.map((e) => e.eventId));
    for (const id of iranIds) expect(ukraineIds.has(id)).toBe(false);
  });
});
