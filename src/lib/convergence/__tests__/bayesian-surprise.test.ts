import { describe, expect, it } from "vitest";
import { bayesianConfidence } from "../bayesian-scorer";
import type { ClusterEvent } from "../types";

const NOW = new Date("2026-04-08T12:00:00Z").getTime();

function makeEvent(
  overrides: Partial<ClusterEvent> & Pick<ClusterEvent, "sourceId" | "category">
): ClusterEvent {
  return {
    eventId: overrides.eventId ?? `e-${Math.random()}`,
    sourceId: overrides.sourceId,
    category: overrides.category,
    severity: overrides.severity ?? "high",
    reliability: overrides.reliability ?? 0.9,
    title: overrides.title ?? "test",
    lat: overrides.lat ?? 0,
    lng: overrides.lng ?? 0,
    publishedAt: overrides.publishedAt ?? new Date(NOW - 60 * 1000).toISOString(),
  };
}

describe("bayesian-scorer — baseline surprise + prior override", () => {
  const basicEvents = [
    makeEvent({ sourceId: "kandilli", category: "natural" }),
    makeEvent({ sourceId: "hibp-breaches", category: "cyber" }),
  ];

  it("surprise multiplier 1.0 produces same result as no multiplier", () => {
    const neutral = bayesianConfidence(basicEvents, [], { now: NOW });
    const explicit = bayesianConfidence(basicEvents, [], {
      now: NOW,
      surpriseMultiplier: 1.0,
    });
    expect(explicit).toBe(neutral);
  });

  it("surprise multiplier >1.0 amplifies the belief movement from prior", () => {
    const normal = bayesianConfidence(basicEvents, [], { now: NOW });
    const surprising = bayesianConfidence(basicEvents, [], {
      now: NOW,
      surpriseMultiplier: 3.0,
    });
    expect(surprising).toBeGreaterThan(normal);
  });

  it("surprise multiplier <1.0 dampens the movement (less confident)", () => {
    const normal = bayesianConfidence(basicEvents, [], { now: NOW });
    const boring = bayesianConfidence(basicEvents, [], {
      now: NOW,
      surpriseMultiplier: 0.3,
    });
    // If original movement was positive, damping should lower the confidence.
    if (normal > 0.3) {
      expect(boring).toBeLessThan(normal);
    }
  });

  it("priorOverride changes the starting belief", () => {
    const conservative = bayesianConfidence(basicEvents, [], {
      now: NOW,
      priorOverride: 0.1,
    });
    const aggressive = bayesianConfidence(basicEvents, [], {
      now: NOW,
      priorOverride: 0.6,
    });
    expect(aggressive).toBeGreaterThan(conservative);
  });

  it("both options combine correctly", () => {
    const combined = bayesianConfidence(basicEvents, [], {
      now: NOW,
      priorOverride: 0.5,
      surpriseMultiplier: 2.0,
    });
    expect(combined).toBeGreaterThan(0);
    expect(combined).toBeLessThanOrEqual(1);
  });
});
