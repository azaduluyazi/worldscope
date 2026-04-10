import { describe, expect, it } from "vitest";
import { bayesianConfidence, explainBayesian, BAYESIAN_PRIOR } from "../bayesian-scorer";
import type { ClusterEvent, ImpactLink } from "../types";

const NOW = new Date("2026-04-08T12:00:00Z").getTime();

function makeEvent(
  overrides: Partial<ClusterEvent> & Pick<ClusterEvent, "sourceId">
): ClusterEvent {
  return {
    eventId: overrides.eventId ?? `e-${Math.random()}`,
    sourceId: overrides.sourceId,
    category: overrides.category ?? "natural",
    severity: overrides.severity ?? "high",
    reliability: overrides.reliability ?? 0.9,
    title: overrides.title ?? "test",
    lat: overrides.lat ?? 0,
    lng: overrides.lng ?? 0,
    publishedAt: overrides.publishedAt ?? new Date(NOW - 60 * 1000).toISOString(),
  };
}

describe("bayesian-scorer", () => {
  it("returns 0 for fewer than 2 events", () => {
    expect(bayesianConfidence([], [])).toBe(0);
    expect(bayesianConfidence([makeEvent({ sourceId: "a" })], [])).toBe(0);
  });

  it("evidence accumulates: more strong signals → higher confidence", () => {
    const fresh = new Date(NOW - 60 * 1000).toISOString();
    const baseArgs = {
      reliability: 0.9,
      severity: "high" as const,
      publishedAt: fresh,
    };
    const two = bayesianConfidence(
      [
        makeEvent({ sourceId: "kandilli", category: "natural", ...baseArgs }),
        makeEvent({ sourceId: "hibp-breaches", category: "cyber", ...baseArgs }),
      ],
      []
    );
    const five = bayesianConfidence(
      [
        makeEvent({ sourceId: "kandilli", category: "natural", ...baseArgs }),
        makeEvent({ sourceId: "hibp-breaches", category: "cyber", ...baseArgs }),
        makeEvent({ sourceId: "safecast", category: "natural", ...baseArgs }),
        makeEvent({ sourceId: "gbif", category: "natural", ...baseArgs }),
        makeEvent({ sourceId: "oref", category: "conflict", ...baseArgs }),
      ],
      []
    );
    expect(five).toBeGreaterThan(two);
  });

  it("weak signals lift confidence less than strong signals", () => {
    const args = {
      publishedAt: new Date(NOW - 60 * 1000).toISOString(),
      category: "natural" as const,
    };
    const weak = bayesianConfidence(
      [
        makeEvent({ sourceId: "kandilli", reliability: 0.4, severity: "info", ...args }),
        makeEvent({ sourceId: "hibp-breaches", reliability: 0.4, severity: "info", category: "cyber", publishedAt: args.publishedAt }),
      ],
      []
    );
    const strong = bayesianConfidence(
      [
        makeEvent({ sourceId: "kandilli", reliability: 0.95, severity: "critical", ...args }),
        makeEvent({ sourceId: "hibp-breaches", reliability: 0.95, severity: "critical", category: "cyber", publishedAt: args.publishedAt }),
      ],
      []
    );
    expect(strong).toBeGreaterThan(weak);
  });

  it("syndication dampening: 3 USGS events score less than 3 independent events", () => {
    const args = {
      reliability: 0.95,
      severity: "high" as const,
      publishedAt: new Date(NOW - 60 * 1000).toISOString(),
    };
    const usgs = bayesianConfidence(
      [
        makeEvent({ sourceId: "usgs-4.5w", category: "natural", ...args }),
        makeEvent({ sourceId: "usgs-2.5d", category: "natural", ...args }),
        makeEvent({ sourceId: "usgs-sig-month", category: "conflict", ...args }),
      ],
      []
    );
    const independent = bayesianConfidence(
      [
        makeEvent({ sourceId: "kandilli", category: "natural", ...args }),
        makeEvent({ sourceId: "hibp-breaches", category: "cyber", ...args }),
        makeEvent({ sourceId: "safecast", category: "conflict", ...args }),
      ],
      []
    );
    expect(independent).toBeGreaterThan(usgs);
  });

  it("temporal decay: older events contribute less than fresh ones", () => {
    const fresh = new Date(NOW - 60 * 1000).toISOString();
    const stale = new Date(NOW - 24 * 60 * 60 * 1000).toISOString();
    const freshScore = bayesianConfidence(
      [
        makeEvent({ sourceId: "kandilli", publishedAt: fresh, category: "natural" }),
        makeEvent({ sourceId: "hibp-breaches", publishedAt: fresh, category: "cyber" }),
      ],
      []
    );
    const staleScore = bayesianConfidence(
      [
        makeEvent({ sourceId: "kandilli", publishedAt: stale, category: "natural" }),
        makeEvent({ sourceId: "hibp-breaches", publishedAt: stale, category: "cyber" }),
      ],
      []
    );
    expect(freshScore).toBeGreaterThanOrEqual(staleScore);
  });

  it("explainBayesian returns a per-event breakdown", () => {
    const breakdown = explainBayesian(
      [
        makeEvent({ sourceId: "kandilli", category: "natural" }),
        makeEvent({ sourceId: "hibp-breaches", category: "cyber" }),
      ],
      []
    );
    expect(breakdown.prior).toBe(BAYESIAN_PRIOR);
    expect(breakdown.rawSignalCount).toBe(2);
    expect(breakdown.perEventContributions).toHaveLength(2);
    expect(breakdown.finalConfidence).toBeGreaterThan(0);
  });

  it("chain bonus increases score for causally linked categories", () => {
    const args = { reliability: 0.9, severity: "high" as const, publishedAt: new Date(NOW - 60 * 1000).toISOString() };
    const events = [
      makeEvent({ sourceId: "kandilli", category: "conflict", ...args }),
      makeEvent({ sourceId: "hibp-breaches", category: "energy", ...args }),
    ];
    const chain: ImpactLink[] = [
      {
        from: "conflict",
        to: "energy",
        confidence: 0.85,
        description: "test",
      },
    ];
    const noChain = bayesianConfidence(events, []);
    const withChain = bayesianConfidence(events, chain);
    expect(withChain).toBeGreaterThan(noChain);
  });
});
