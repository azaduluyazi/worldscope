import { describe, expect, it } from "vitest";
import {
  attachToStoryline,
  computeExpiry,
  createStoryline,
  matchScore,
  ttlByConfidence,
  type Storyline,
} from "../storyline";
import type { Convergence } from "../types";

const NOW = new Date("2026-04-08T12:00:00Z").getTime();
const DAY = 24 * 60 * 60 * 1000;

function makeConvergence(overrides: Partial<Convergence> = {}): Convergence {
  return {
    id: overrides.id ?? "conv-1",
    type: overrides.type ?? "geopolitical",
    confidence: overrides.confidence ?? 0.7,
    signals: overrides.signals ?? [
      {
        sourceId: "kandilli",
        eventId: "e1",
        category: "conflict",
        severity: "high",
        reliability: 0.9,
        role: "trigger",
        title: "Test event",
        publishedAt: new Date(NOW).toISOString(),
        lat: 36.5,
        lng: 36.0,
      },
    ],
    impactChain: [],
    timeline: { start: new Date(NOW).toISOString(), end: new Date(NOW).toISOString() },
    location: { lat: 36.5, lng: 36.0 },
    affectedRegions: ["ME"],
    createdAt: new Date(NOW).toISOString(),
    expiresAt: new Date(NOW + DAY).toISOString(),
    ...overrides,
  };
}

function makeStory(overrides: Partial<Storyline> = {}): Storyline {
  return {
    id: overrides.id ?? "story-1",
    type: overrides.type ?? "geopolitical",
    peakConfidence: overrides.peakConfidence ?? 0.7,
    snapshots: overrides.snapshots ?? [makeConvergence()],
    centroid: overrides.centroid ?? { lat: 36.5, lng: 36.0 },
    categories: overrides.categories ?? ["conflict"],
    affectedRegions: overrides.affectedRegions ?? ["ME"],
    headline: overrides.headline ?? "Test storyline",
    createdAt: overrides.createdAt ?? new Date(NOW - DAY).toISOString(),
    lastActivityAt: overrides.lastActivityAt ?? new Date(NOW - 60 * 1000).toISOString(),
    expiresAt: overrides.expiresAt ?? new Date(NOW + 7 * DAY).toISOString(),
  };
}

describe("storyline", () => {
  describe("ttlByConfidence", () => {
    it("returns 14 days for very high confidence", () => {
      expect(ttlByConfidence(0.95)).toBe(14 * DAY);
      expect(ttlByConfidence(0.85)).toBe(14 * DAY);
    });

    it("returns 7 days for medium-high confidence", () => {
      expect(ttlByConfidence(0.75)).toBe(7 * DAY);
      expect(ttlByConfidence(0.65)).toBe(7 * DAY);
    });

    it("returns 3 days for medium confidence", () => {
      expect(ttlByConfidence(0.55)).toBe(3 * DAY);
      expect(ttlByConfidence(0.45)).toBe(3 * DAY);
    });

    it("returns 24h for low confidence", () => {
      expect(ttlByConfidence(0.3)).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe("computeExpiry", () => {
    it("returns base TTL for first snapshot", () => {
      const expiry = computeExpiry(0.9, 1, NOW);
      expect(new Date(expiry).getTime() - NOW).toBe(14 * DAY);
    });

    it("extends TTL with each new snapshot, capped at 2x base", () => {
      // confidence 0.9 → base = 14d, cap at 2x base = 28d
      // refreshes = snapshotCount - 1
      // extension = min(base, refreshes × base × 0.5) = min(14d, refreshes × 7d)
      // snapshot 1 → ext=0   → total = 14d
      // snapshot 2 → ext=7d  → total = 21d
      // snapshot 3 → ext=14d → total = 28d  (CAP HIT)
      // snapshot 10 → ext=14d → total = 28d (CAP)
      const e1 = new Date(computeExpiry(0.9, 1, NOW)).getTime();
      const e2 = new Date(computeExpiry(0.9, 2, NOW)).getTime();
      const e3 = new Date(computeExpiry(0.9, 3, NOW)).getTime();
      const e10 = new Date(computeExpiry(0.9, 10, NOW)).getTime();

      expect(e2).toBeGreaterThan(e1);
      expect(e3).toBeGreaterThan(e2);
      // Cap at 2x base = 28 days — snapshot 10 hits the same cap as snapshot 3
      expect(e10).toBe(e3);
      expect(e10 - NOW).toBeLessThanOrEqual(28 * DAY);
    });
  });

  describe("matchScore", () => {
    it("returns 0 for expired storylines", () => {
      const expired = makeStory({ expiresAt: new Date(NOW - DAY).toISOString() });
      const conv = makeConvergence();
      expect(matchScore(conv, expired, NOW)).toBe(0);
    });

    it("returns 0 when geographically too far", () => {
      const story = makeStory({ centroid: { lat: 0, lng: 0 } });
      const conv = makeConvergence({ location: { lat: 60, lng: 60 } }); // ~9000km
      expect(matchScore(conv, story, NOW)).toBe(0);
    });

    it("returns 0 when no category overlap", () => {
      const story = makeStory({ categories: ["finance"] });
      const conv = makeConvergence({
        signals: [
          {
            sourceId: "x",
            eventId: "e",
            category: "sports",
            severity: "low",
            reliability: 0.5,
            role: "reaction",
            title: "x",
            publishedAt: new Date(NOW).toISOString(),
            lat: 36.5,
            lng: 36.0,
          },
        ],
      });
      expect(matchScore(conv, story, NOW)).toBe(0);
    });

    it("returns positive score for nearby + same-category match", () => {
      const story = makeStory({
        centroid: { lat: 36.5, lng: 36.0 },
        categories: ["conflict"],
      });
      const conv = makeConvergence({ location: { lat: 36.6, lng: 36.1 } });
      expect(matchScore(conv, story, NOW)).toBeGreaterThan(0);
    });
  });

  describe("createStoryline", () => {
    it("creates a fresh storyline from a convergence", () => {
      const conv = makeConvergence({ confidence: 0.9 });
      const story = createStoryline(conv, NOW);
      expect(story.snapshots).toHaveLength(1);
      expect(story.peakConfidence).toBe(0.9);
      expect(story.centroid).toEqual(conv.location);
      expect(story.id).toMatch(/^story-/);
    });
  });

  describe("attachToStoryline", () => {
    it("returns null when no candidates exist", () => {
      const conv = makeConvergence();
      expect(attachToStoryline(conv, [], NOW)).toBeNull();
    });

    it("attaches to a high-scoring match", () => {
      const story = makeStory({
        centroid: { lat: 36.5, lng: 36.0 },
        categories: ["conflict"],
      });
      const conv = makeConvergence({ location: { lat: 36.51, lng: 36.01 } });
      const result = attachToStoryline(conv, [story], NOW);
      expect(result).not.toBeNull();
      expect(result!.story.snapshots).toHaveLength(2);
      expect(result!.story.id).toBe(story.id);
    });

    it("returns null when match score is below threshold", () => {
      const story = makeStory({
        centroid: { lat: 0, lng: 0 },
        categories: ["finance"],
      });
      const conv = makeConvergence({
        location: { lat: 60, lng: 60 },
      });
      expect(attachToStoryline(conv, [story], NOW)).toBeNull();
    });

    it("updates peakConfidence on attach", () => {
      const story = makeStory({ peakConfidence: 0.6 });
      const conv = makeConvergence({ confidence: 0.9 });
      const result = attachToStoryline(conv, [story], NOW);
      expect(result!.story.peakConfidence).toBe(0.9);
    });
  });
});
