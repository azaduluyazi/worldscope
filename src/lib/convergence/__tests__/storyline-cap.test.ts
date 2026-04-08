import { describe, expect, it } from "vitest";
import {
  attachToStoryline,
  createStoryline,
  MAX_STORYLINE_SNAPSHOTS,
} from "../storyline";
import type { Convergence } from "../types";

const NOW = new Date("2026-04-08T12:00:00Z").getTime();

function makeConvergence(id: string, confidence: number): Convergence {
  return {
    id,
    type: "geopolitical",
    confidence,
    signals: [
      {
        sourceId: "kandilli",
        eventId: `e-${id}`,
        category: "conflict",
        severity: "high",
        reliability: 0.9,
        role: "trigger",
        title: `Event ${id}`,
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
    expiresAt: new Date(NOW + 86_400_000).toISOString(),
  };
}

describe("storyline snapshot cap", () => {
  it("caps the snapshots array at MAX_STORYLINE_SNAPSHOTS", () => {
    let story = createStoryline(makeConvergence("conv-0", 0.9), NOW);

    // Attach way more than the cap
    for (let i = 1; i < MAX_STORYLINE_SNAPSHOTS + 20; i++) {
      const conv = makeConvergence(`conv-${i}`, 0.9);
      const result = attachToStoryline(conv, [story], NOW);
      if (result) story = result.story;
    }

    expect(story.snapshots.length).toBeLessThanOrEqual(MAX_STORYLINE_SNAPSHOTS);
  });

  it("trims OLDEST snapshots first when cap is exceeded", () => {
    let story = createStoryline(makeConvergence("conv-0", 0.9), NOW);

    for (let i = 1; i < MAX_STORYLINE_SNAPSHOTS + 5; i++) {
      const conv = makeConvergence(`conv-${i}`, 0.9);
      const result = attachToStoryline(conv, [story], NOW);
      if (result) story = result.story;
    }

    // The earliest snapshots should be gone, the most recent should remain
    const ids = story.snapshots.map((s) => s.id);
    expect(ids).not.toContain("conv-0");
    expect(ids).not.toContain("conv-1");
    expect(ids).toContain(`conv-${MAX_STORYLINE_SNAPSHOTS + 4}`);
  });

  it("preserves peakConfidence across trims", () => {
    // First convergence has the highest confidence, should still be
    // reflected in peakConfidence even after its snapshot is trimmed.
    let story = createStoryline(makeConvergence("best", 0.99), NOW);

    for (let i = 1; i < MAX_STORYLINE_SNAPSHOTS + 10; i++) {
      const conv = makeConvergence(`conv-${i}`, 0.6);
      const result = attachToStoryline(conv, [story], NOW);
      if (result) story = result.story;
    }

    expect(story.peakConfidence).toBe(0.99);
  });
});
