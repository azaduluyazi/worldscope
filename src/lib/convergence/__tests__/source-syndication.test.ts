import { describe, expect, it } from "vitest";
import {
  computeEffectiveSignalCount,
  explainSyndication,
  getGroupsForSource,
} from "../source-syndication";
import type { ClusterEvent } from "../types";

function makeEvent(sourceId: string, idx: number = 0): ClusterEvent {
  return {
    eventId: `${sourceId}-${idx}`,
    sourceId,
    category: "natural",
    severity: "high",
    reliability: 0.9,
    title: `Event from ${sourceId}`,
    lat: 0,
    lng: 0,
    publishedAt: new Date().toISOString(),
  };
}

describe("source-syndication", () => {
  describe("getGroupsForSource", () => {
    it("returns groups for a USGS source", () => {
      const groups = getGroupsForSource("usgs-4.5w");
      expect(groups.length).toBeGreaterThan(0);
      expect(groups[0].id).toBe("usgs-earthquake-catalog");
    });

    it("returns empty for ungrouped source", () => {
      expect(getGroupsForSource("kandilli")).toEqual([]);
      expect(getGroupsForSource("unknown-source")).toEqual([]);
    });
  });

  describe("computeEffectiveSignalCount", () => {
    it("returns raw count when sources are independent", () => {
      const events = [
        makeEvent("kandilli"),
        makeEvent("hibp-breaches"),
        makeEvent("safecast"),
      ];
      expect(computeEffectiveSignalCount(events)).toBe(3);
    });

    it("dampens 3 USGS events to roughly 1.2", () => {
      const events = [
        makeEvent("usgs-4.5w", 1),
        makeEvent("usgs-2.5d", 2),
        makeEvent("usgs-sig-month", 3),
      ];
      // dampening 0.9 → 1 + 2*(1-0.9) = 1.2
      expect(computeEffectiveSignalCount(events)).toBeCloseTo(1.2, 2);
    });

    it("dampens 4 crypto exchange events to roughly 2.05", () => {
      const events = [
        makeEvent("binance-ticker", 1),
        makeEvent("coinbase-rates", 2),
        makeEvent("crypto-convert", 3),
        makeEvent("freeforex", 4),
      ];
      // dampening 0.65 → 1 + 3*(1-0.65) = 2.05
      expect(computeEffectiveSignalCount(events)).toBeCloseTo(2.05, 2);
    });

    it("mixes grouped and ungrouped events correctly", () => {
      const events = [
        makeEvent("usgs-4.5w", 1),     // group A
        makeEvent("usgs-2.5d", 2),     // group A
        makeEvent("kandilli", 3),       // independent
        makeEvent("nasa-eonet", 4),     // group B
      ];
      // group A: 1 + 1*0.1 = 1.1
      // group B: 1 (only one event in nasa group)
      // ungrouped: 1 (kandilli)
      // total: 3.1
      expect(computeEffectiveSignalCount(events)).toBeCloseTo(3.1, 2);
    });

    it("handles edge cases", () => {
      expect(computeEffectiveSignalCount([])).toBe(0);
      expect(computeEffectiveSignalCount([makeEvent("kandilli")])).toBe(1);
    });
  });

  describe("explainSyndication", () => {
    it("provides a debug breakdown", () => {
      const events = [
        makeEvent("usgs-4.5w", 1),
        makeEvent("usgs-2.5d", 2),
        makeEvent("usgs-sig-month", 3),
        makeEvent("kandilli", 4),
      ];
      const breakdown = explainSyndication(events);
      expect(breakdown.rawCount).toBe(4);
      expect(breakdown.effectiveCount).toBeCloseTo(2.2, 2); // 1.2 + 1
      expect(breakdown.activeGroups).toHaveLength(1);
      expect(breakdown.activeGroups[0].group.id).toBe("usgs-earthquake-catalog");
      expect(breakdown.ungroupedCount).toBe(1);
    });
  });
});
