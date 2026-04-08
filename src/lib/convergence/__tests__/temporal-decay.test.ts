import { describe, expect, it } from "vitest";
import {
  getHalfLife,
  temporalDecayWeight,
  temporalDecayWeightFloored,
} from "../temporal-decay";

const HOUR = 60 * 60 * 1000;

describe("temporal-decay", () => {
  describe("getHalfLife", () => {
    it("scales with severity", () => {
      const critical = getHalfLife("conflict", "critical");
      const medium = getHalfLife("conflict", "medium");
      const info = getHalfLife("conflict", "info");
      expect(critical).toBeGreaterThan(medium);
      expect(medium).toBeGreaterThan(info);
      expect(critical / medium).toBeCloseTo(2.0);
    });

    it("differentiates fast vs slow categories", () => {
      const finance = getHalfLife("finance", "high");
      const diplomacy = getHalfLife("diplomacy", "high");
      expect(diplomacy).toBeGreaterThan(finance);
    });
  });

  describe("temporalDecayWeight", () => {
    const NOW = new Date("2026-04-08T12:00:00Z").getTime();

    it("returns ~1.0 for fresh events", () => {
      const fresh = new Date(NOW - 60 * 1000).toISOString(); // 1 min old
      const w = temporalDecayWeight(fresh, "conflict", "high", NOW);
      expect(w).toBeGreaterThan(0.99);
    });

    it("returns 0.5 at exactly half-life", () => {
      const halfLife = getHalfLife("conflict", "high");
      const at = new Date(NOW - halfLife).toISOString();
      const w = temporalDecayWeight(at, "conflict", "high", NOW);
      expect(w).toBeCloseTo(0.5, 3);
    });

    it("returns 0.25 at 2x half-life", () => {
      const halfLife = getHalfLife("finance", "medium");
      const at = new Date(NOW - 2 * halfLife).toISOString();
      const w = temporalDecayWeight(at, "finance", "medium", NOW);
      expect(w).toBeCloseTo(0.25, 3);
    });

    it("clamps future-dated events to 1.0", () => {
      const future = new Date(NOW + 5 * HOUR).toISOString();
      expect(temporalDecayWeight(future, "conflict", "high", NOW)).toBe(1.0);
    });
  });

  describe("temporalDecayWeightFloored", () => {
    const NOW = Date.now();

    it("never returns less than the floor", () => {
      const ancient = new Date(NOW - 1000 * HOUR).toISOString();
      const w = temporalDecayWeightFloored(ancient, "finance", "info", 0.05, NOW);
      expect(w).toBeGreaterThanOrEqual(0.05);
    });
  });
});
