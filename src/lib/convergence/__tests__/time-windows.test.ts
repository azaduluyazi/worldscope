import { describe, expect, it } from "vitest";
import {
  CATEGORY_GEO_RADIUS_KM,
  CATEGORY_TIME_WINDOWS,
  getGeoRadiusForPair,
  getGeoRadiusForSet,
  getTimeWindowForPair,
  getTimeWindowForSet,
} from "../time-windows";

const HOUR = 60 * 60 * 1000;

describe("time-windows", () => {
  describe("CATEGORY_TIME_WINDOWS", () => {
    it("includes all 11 categories", () => {
      const expected = [
        "finance", "cyber", "energy", "natural", "conflict",
        "aviation", "health", "protest", "diplomacy", "tech", "sports",
      ];
      for (const cat of expected) {
        expect(CATEGORY_TIME_WINDOWS).toHaveProperty(cat);
        expect(CATEGORY_TIME_WINDOWS[cat as keyof typeof CATEGORY_TIME_WINDOWS]).toBeGreaterThan(0);
      }
    });

    it("finance is the fastest category (smallest window)", () => {
      const finance = CATEGORY_TIME_WINDOWS.finance;
      const others = [
        CATEGORY_TIME_WINDOWS.diplomacy,
        CATEGORY_TIME_WINDOWS.health,
        CATEGORY_TIME_WINDOWS.tech,
        CATEGORY_TIME_WINDOWS.cyber,
      ];
      for (const o of others) {
        expect(finance).toBeLessThanOrEqual(o);
      }
    });

    it("diplomacy is the slowest category (largest window)", () => {
      expect(CATEGORY_TIME_WINDOWS.diplomacy).toBe(24 * HOUR);
      // Should be greater than every other category
      for (const [cat, w] of Object.entries(CATEGORY_TIME_WINDOWS)) {
        if (cat === "diplomacy") continue;
        expect(CATEGORY_TIME_WINDOWS.diplomacy).toBeGreaterThanOrEqual(w);
      }
    });
  });

  describe("CATEGORY_GEO_RADIUS_KM", () => {
    it("protest has the smallest radius (city-scale)", () => {
      expect(CATEGORY_GEO_RADIUS_KM.protest).toBe(25);
    });

    it("cyber/diplomacy/tech have the largest radii", () => {
      expect(CATEGORY_GEO_RADIUS_KM.cyber).toBe(1000);
      expect(CATEGORY_GEO_RADIUS_KM.diplomacy).toBe(1000);
      expect(CATEGORY_GEO_RADIUS_KM.tech).toBe(1000);
    });

    it("natural radius covers earthquake aftermath (>=500km)", () => {
      expect(CATEGORY_GEO_RADIUS_KM.natural).toBeGreaterThanOrEqual(500);
    });
  });

  describe("getTimeWindowForPair", () => {
    it("returns the max of the two categories' windows", () => {
      const fin = CATEGORY_TIME_WINDOWS.finance;
      const dip = CATEGORY_TIME_WINDOWS.diplomacy;
      expect(getTimeWindowForPair("finance", "diplomacy")).toBe(dip);
      expect(getTimeWindowForPair("diplomacy", "finance")).toBe(dip);
      expect(getTimeWindowForPair("finance", "finance")).toBe(fin);
    });
  });

  describe("getGeoRadiusForPair", () => {
    it("returns the max of the two categories' radii (asymmetric pairs)", () => {
      // Protest + finance: protest=25km, finance=500km → max=500km
      // This is the v2 fix that lets a city protest correlate with a
      // regional market reaction.
      expect(getGeoRadiusForPair("protest", "finance")).toBe(500);
      expect(getGeoRadiusForPair("finance", "protest")).toBe(500);
    });
  });

  describe("getTimeWindowForSet", () => {
    it("returns the slowest category's window for a set", () => {
      const window = getTimeWindowForSet(["finance", "diplomacy", "natural"]);
      expect(window).toBe(CATEGORY_TIME_WINDOWS.diplomacy);
    });

    it("returns a safe default for empty set", () => {
      expect(getTimeWindowForSet([])).toBe(2 * HOUR);
    });
  });

  describe("getGeoRadiusForSet", () => {
    it("returns the widest category's radius for a set", () => {
      const r = getGeoRadiusForSet(["protest", "finance", "natural"]);
      expect(r).toBe(500); // max of (25, 500, 500)
    });

    it("returns a safe default for empty set", () => {
      expect(getGeoRadiusForSet([])).toBe(50);
    });
  });
});
