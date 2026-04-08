import { describe, expect, it } from "vitest";
import { detectCounterFactuals, asStored } from "../counter-factual";
import type { ClusterEvent, ConvergencePrediction } from "../types";

const NOW = new Date("2026-04-08T12:00:00Z").getTime();
const HOUR = 60 * 60 * 1000;

function makePrediction(
  overrides: Partial<ConvergencePrediction> = {}
): ConvergencePrediction {
  return {
    predictedCategory: "energy",
    probability: 0.80, // boundary: elevated (< 0.85)
    expectedWindowMs: 4 * HOUR,
    reasoning: "test",
    triggerEventId: "trigger-1",
    generatedAt: new Date(NOW - 5 * HOUR).toISOString(),
    expiresAt: new Date(NOW - HOUR).toISOString(), // already expired
    validated: false,
    ...overrides,
  };
}

function makeEvent(opts: Partial<ClusterEvent> & Pick<ClusterEvent, "category">): ClusterEvent {
  return {
    eventId: opts.eventId ?? "e",
    sourceId: opts.sourceId ?? "kandilli",
    category: opts.category,
    severity: opts.severity ?? "high",
    reliability: opts.reliability ?? 0.9,
    title: opts.title ?? "test",
    lat: opts.lat ?? 0,
    lng: opts.lng ?? 0,
    publishedAt: opts.publishedAt ?? new Date(NOW - 2 * HOUR).toISOString(),
  };
}

describe("counter-factual detector", () => {
  it("flags missing high-prob predictions when window expires with no match", () => {
    const stored = asStored("conv-1", makePrediction()); // probability = 0.80
    const events = [makeEvent({ category: "natural" })]; // wrong category

    const cfs = detectCounterFactuals([stored], events, NOW);
    expect(cfs).toHaveLength(1);
    expect(cfs[0].kind).toBe("missing_reaction");
    expect(cfs[0].severity).toBe("elevated"); // 0.80 < 0.85 → elevated
  });

  it("does not flag low-probability misses (those are not news)", () => {
    const stored = asStored("conv-1", makePrediction({ probability: 0.5 }));
    const events = [makeEvent({ category: "natural" })];

    const cfs = detectCounterFactuals([stored], events, NOW);
    expect(cfs).toHaveLength(0);
  });

  it("does not flag predictions that DID validate", () => {
    const stored = asStored(
      "conv-1",
      makePrediction({ probability: 0.9, predictedCategory: "energy" })
    );
    const events = [
      makeEvent({
        category: "energy",
        publishedAt: new Date(NOW - 3 * HOUR).toISOString(),
      }),
    ];

    const cfs = detectCounterFactuals([stored], events, NOW);
    expect(cfs).toHaveLength(0);
  });

  it("emits a premature_silence early warning halfway through the window", () => {
    const generated = NOW - 2 * HOUR;
    const expires = NOW + 2 * HOUR; // 4h window, halfway done
    const stored = asStored(
      "conv-1",
      makePrediction({
        probability: 0.9,
        generatedAt: new Date(generated).toISOString(),
        expiresAt: new Date(expires).toISOString(),
      })
    );

    // No matching event yet
    const events = [makeEvent({ category: "natural" })];
    const cfs = detectCounterFactuals([stored], events, NOW);

    expect(cfs).toHaveLength(1);
    expect(cfs[0].kind).toBe("premature_silence");
    expect(cfs[0].severity).toBe("info");
  });

  it("uses 'high' severity for very-high-probability misses", () => {
    const stored = asStored("conv-1", makePrediction({ probability: 0.9 }));
    const cfs = detectCounterFactuals([stored], [], NOW);
    expect(cfs[0].severity).toBe("high");
  });

  it("handles empty inputs gracefully", () => {
    expect(detectCounterFactuals([], [], NOW)).toEqual([]);
    expect(detectCounterFactuals([], [makeEvent({ category: "natural" })], NOW)).toEqual([]);
  });
});
