import { describe, expect, it } from "vitest";
import {
  deserializeKey,
  keyFromCategories,
  serializeKey,
  surpriseMultiplier,
} from "../baseline";

describe("baseline", () => {
  describe("serializeKey / deserializeKey", () => {
    it("round-trips a key losslessly", () => {
      const key = {
        categoryA: "conflict" as const,
        categoryB: "finance" as const,
        region: "ME",
        hourOfDay: 14,
        dayOfWeek: 3,
      };
      const serialized = serializeKey(key);
      const restored = deserializeKey(serialized);
      // Categories may be reordered alphabetically
      expect(new Set([restored.categoryA, restored.categoryB])).toEqual(
        new Set([key.categoryA, key.categoryB])
      );
      expect(restored.region).toBe(key.region);
      expect(restored.hourOfDay).toBe(key.hourOfDay);
      expect(restored.dayOfWeek).toBe(key.dayOfWeek);
    });

    it("collapses (A,B) and (B,A) to the same key", () => {
      const ab = serializeKey({
        categoryA: "conflict",
        categoryB: "finance",
        region: "ME",
        hourOfDay: 14,
        dayOfWeek: 3,
      });
      const ba = serializeKey({
        categoryA: "finance",
        categoryB: "conflict",
        region: "ME",
        hourOfDay: 14,
        dayOfWeek: 3,
      });
      expect(ab).toBe(ba);
    });
  });

  describe("surpriseMultiplier", () => {
    it("returns neutral 1.0 when baseline is too sparse", () => {
      expect(surpriseMultiplier(10, 5, 2)).toBe(1.0);
      expect(surpriseMultiplier(10, 0, 100)).toBe(1.0);
    });

    it("returns ~1.0 when observed equals baseline", () => {
      const surprise = surpriseMultiplier(5, 5, 100);
      expect(surprise).toBeCloseTo(1.0, 1);
    });

    it("increases for above-baseline rates", () => {
      const baseline = 5;
      const ratio2x = surpriseMultiplier(10, baseline, 100);
      const ratio4x = surpriseMultiplier(20, baseline, 100);
      const ratio10x = surpriseMultiplier(50, baseline, 100);
      expect(ratio2x).toBeGreaterThan(1.0);
      expect(ratio4x).toBeGreaterThan(ratio2x);
      expect(ratio10x).toBeGreaterThan(ratio4x);
    });

    it("clamps the multiplier at 4.0", () => {
      expect(surpriseMultiplier(10000, 1, 100)).toBe(4.0);
    });

    it("never returns less than 1.0", () => {
      expect(surpriseMultiplier(0, 100, 100)).toBeGreaterThanOrEqual(1.0);
    });
  });

  describe("keyFromCategories", () => {
    it("generates one key per unordered category pair", () => {
      const keys = keyFromCategories(
        ["conflict", "energy", "finance"],
        "ME",
        new Date("2026-04-08T14:00:00Z")
      );
      expect(keys).toHaveLength(3); // C(3,2) = 3
    });

    it("includes hour-of-day and day-of-week from timestamp", () => {
      const ts = new Date("2026-04-08T14:30:00Z"); // Wednesday 14:00 UTC
      const keys = keyFromCategories(["conflict", "finance"], "EU", ts);
      expect(keys[0].hourOfDay).toBe(14);
      expect(keys[0].dayOfWeek).toBe(ts.getUTCDay());
    });

    it("returns empty array for fewer than 2 categories", () => {
      expect(keyFromCategories(["conflict"], "ME")).toEqual([]);
      expect(keyFromCategories([], "ME")).toEqual([]);
    });
  });
});
