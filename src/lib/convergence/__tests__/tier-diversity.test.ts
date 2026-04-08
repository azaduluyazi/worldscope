import { describe, expect, it } from "vitest";
import {
  bayesianConfidence,
  computeTierDiversityBonus,
  explainBayesian,
} from "../bayesian-scorer";
import type { ClusterEvent } from "../types";

// ═══════════════════════════════════════════════════════════════════
//  Tier Diversity Bonus — heterogeneity rewards
// ═══════════════════════════════════════════════════════════════════
//
//  Asserts the v3.5 design intent from source-reliability.ts:
//   "The convergence scorer's heterogeneity bonus rewards a T1+T4
//    match more than two T1 matches, so this 'low quality' data has
//    real value precisely because it represents a different
//    epistemic population."
//
//  Without this test, the bonus is invisible — easy to silently
//  regress in a future refactor.
//
// ═══════════════════════════════════════════════════════════════════

const NOW = new Date("2026-04-08T12:00:00Z").getTime();
const FRESH = new Date(NOW - 60 * 1000).toISOString();

function makeEvent(
  overrides: Partial<ClusterEvent> & Pick<ClusterEvent, "sourceId" | "category" | "tier">
): ClusterEvent {
  return {
    eventId: overrides.eventId ?? `e-${Math.random()}`,
    sourceId: overrides.sourceId,
    category: overrides.category,
    severity: overrides.severity ?? "high",
    reliability: overrides.reliability ?? 0.85,
    tier: overrides.tier,
    title: overrides.title ?? "test",
    lat: overrides.lat ?? 0,
    lng: overrides.lng ?? 0,
    publishedAt: overrides.publishedAt ?? FRESH,
  };
}

describe("computeTierDiversityBonus", () => {
  it("returns 1.0 for an empty or single-event cluster", () => {
    expect(computeTierDiversityBonus([])).toBe(1.0);
    expect(computeTierDiversityBonus([makeEvent({ sourceId: "a", category: "natural", tier: 1 })])).toBe(1.0);
  });

  it("returns 1.0 when all events share the same tier", () => {
    const events = [
      makeEvent({ sourceId: "a", category: "natural", tier: 1 }),
      makeEvent({ sourceId: "b", category: "conflict", tier: 1 }),
      makeEvent({ sourceId: "c", category: "energy", tier: 1 }),
    ];
    expect(computeTierDiversityBonus(events)).toBe(1.0);
  });

  it("returns 1.16 for 2 distinct tiers (T1+T4)", () => {
    const events = [
      makeEvent({ sourceId: "a", category: "natural", tier: 1 }),
      makeEvent({ sourceId: "b", category: "conflict", tier: 4 }),
    ];
    expect(computeTierDiversityBonus(events)).toBeCloseTo(1.16, 2);
  });

  it("returns ~1.30 for 3 distinct tiers", () => {
    const events = [
      makeEvent({ sourceId: "a", category: "natural", tier: 1 }),
      makeEvent({ sourceId: "b", category: "conflict", tier: 3 }),
      makeEvent({ sourceId: "c", category: "energy", tier: 4 }),
    ];
    const bonus = computeTierDiversityBonus(events);
    expect(bonus).toBeGreaterThan(1.25);
    expect(bonus).toBeLessThan(1.35);
  });

  it("caps at 1.40 for 4 distinct tiers", () => {
    const events = [
      makeEvent({ sourceId: "a", category: "natural", tier: 1 }),
      makeEvent({ sourceId: "b", category: "conflict", tier: 2 }),
      makeEvent({ sourceId: "c", category: "energy", tier: 3 }),
      makeEvent({ sourceId: "d", category: "finance", tier: 4 }),
    ];
    expect(computeTierDiversityBonus(events)).toBeCloseTo(1.40, 2);
  });

  it("treats missing tier as T3 (no spurious diversity)", () => {
    const events = [
      makeEvent({ sourceId: "a", category: "natural", tier: undefined as never }),
      makeEvent({ sourceId: "b", category: "conflict", tier: undefined as never }),
    ];
    // Both default to T3, so 1 unique tier → 1.0 (no bonus)
    expect(computeTierDiversityBonus(events)).toBe(1.0);
  });
});

describe("bayesianConfidence — heterogeneity reward", () => {
  it("T1+T4 cluster scores HIGHER than T1+T1 cluster (key invariant)", () => {
    // Two T1 sources in different categories
    const t1Plus1 = [
      makeEvent({ sourceId: "usgs-1", category: "natural", tier: 1, reliability: 0.85 }),
      makeEvent({ sourceId: "reuters-1", category: "conflict", tier: 1, reliability: 0.85 }),
    ];

    // T1 + T4 (e.g. USGS earthquake + Reddit r/earthquake confirmation)
    const t1Plus4 = [
      makeEvent({ sourceId: "usgs-1", category: "natural", tier: 1, reliability: 0.85 }),
      makeEvent({ sourceId: "reddit-1", category: "conflict", tier: 4, reliability: 0.85 }),
    ];

    const homogeneous = bayesianConfidence(t1Plus1, [], { now: NOW });
    const heterogeneous = bayesianConfidence(t1Plus4, [], { now: NOW });

    expect(heterogeneous).toBeGreaterThan(homogeneous);
  });

  it("4-tier cluster scores higher than 1-tier cluster (max diversity)", () => {
    // Use moderate reliability + medium severity so sigmoid has headroom
    // for the tier bonus to show through. With reliability 0.85 + high
    // severity, even 2 events saturate to ~1.0 and the bonus is invisible.
    const args = { reliability: 0.55, severity: "medium" as const, publishedAt: FRESH };
    const allT1 = [
      makeEvent({ sourceId: "a1", category: "natural", tier: 1, ...args }),
      makeEvent({ sourceId: "a2", category: "conflict", tier: 1, ...args }),
    ];
    const twoTiers = [
      makeEvent({ sourceId: "b1", category: "natural", tier: 1, ...args }),
      makeEvent({ sourceId: "b2", category: "conflict", tier: 4, ...args }),
    ];

    const homo = bayesianConfidence(allT1, [], { now: NOW });
    const hetero = bayesianConfidence(twoTiers, [], { now: NOW });
    expect(hetero).toBeGreaterThan(homo);
  });

  it("explainBayesian surfaces tier diversity in the breakdown", () => {
    const events = [
      makeEvent({ sourceId: "usgs", category: "natural", tier: 1 }),
      makeEvent({ sourceId: "reddit", category: "conflict", tier: 4 }),
    ];
    const breakdown = explainBayesian(events, [], { now: NOW });
    expect(breakdown.tierDiversityBonus).toBeGreaterThan(1.0);
    expect(breakdown.uniqueTierCount).toBe(2);
  });

  it("does not regress when tier metadata is absent (backward compat)", () => {
    // Old call sites without tier — should default to T3 across the board,
    // giving 1.0 bonus (no diversity) and behaving like v3.4.
    const events = [
      makeEvent({ sourceId: "kandilli", category: "natural", tier: undefined as never }),
      makeEvent({ sourceId: "hibp-breaches", category: "cyber", tier: undefined as never }),
    ];
    const breakdown = explainBayesian(events, [], { now: NOW });
    expect(breakdown.tierDiversityBonus).toBe(1.0);
    expect(breakdown.uniqueTierCount).toBe(1);
  });
});
