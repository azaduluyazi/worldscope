import { describe, expect, it } from "vitest";
import { computePriorAdjustment } from "../calibration";
import type { ConfidenceBucket } from "../telemetry";

function bucket(
  min: number,
  max: number,
  shown: number,
  ctr: number
): ConfidenceBucket {
  return {
    min,
    max,
    shown,
    clicked: Math.round(shown * ctr),
    ctr,
  };
}

describe("calibration", () => {
  describe("computePriorAdjustment", () => {
    it("returns null when there's not enough data", () => {
      // Only 1 informative bucket — not enough
      const buckets = [bucket(0.4, 0.5, 100, 0.1), bucket(0.5, 0.6, 10, 0.2)];
      expect(computePriorAdjustment(buckets)).toBeNull();
    });

    it("raises the prior when CTR is higher than target", () => {
      // Each bucket's CTR is much HIGHER than its midpoint target.
      // This means the scorer is under-confident — prior should go UP.
      const buckets = [
        bucket(0.4, 0.5, 100, 0.8), // target 0.45, actual 0.80 (way higher)
        bucket(0.5, 0.6, 100, 0.85), // target 0.55, actual 0.85
        bucket(0.6, 0.7, 100, 0.9), // target 0.65, actual 0.90
      ];
      const result = computePriorAdjustment(buckets, 0.30);
      expect(result).not.toBeNull();
      expect(result!.newPrior).toBeGreaterThan(0.30);
      expect(result!.avgError).toBeGreaterThan(0);
      expect(result!.reason).toMatch(/under-confident/);
    });

    it("lowers the prior when CTR is lower than target", () => {
      // CTR is much LOWER than midpoint — scorer is over-confident
      const buckets = [
        bucket(0.7, 0.8, 100, 0.2), // target 0.75, actual 0.20 (way lower)
        bucket(0.8, 0.9, 100, 0.25),
        bucket(0.9, 1.01, 100, 0.3),
      ];
      const result = computePriorAdjustment(buckets, 0.30);
      expect(result).not.toBeNull();
      expect(result!.newPrior).toBeLessThan(0.30);
      expect(result!.avgError).toBeLessThan(0);
      expect(result!.reason).toMatch(/over-confident/);
    });

    it("clamps the prior to [0.05, 0.70]", () => {
      // Extreme positive error — prior should cap at 0.70
      const extreme = [
        bucket(0.4, 0.5, 1000, 0.99),
        bucket(0.5, 0.6, 1000, 0.99),
      ];
      const high = computePriorAdjustment(extreme, 0.65);
      expect(high!.newPrior).toBeLessThanOrEqual(0.70);

      // Extreme negative error — prior should cap at 0.05
      const extremeLow = [
        bucket(0.8, 0.9, 1000, 0.01),
        bucket(0.9, 1.01, 1000, 0.01),
      ];
      const low = computePriorAdjustment(extremeLow, 0.10);
      expect(low!.newPrior).toBeGreaterThanOrEqual(0.05);
    });

    it("applies damping to avoid oscillation", () => {
      // Moderate error should produce a small adjustment, not full swing
      const buckets = [
        bucket(0.5, 0.6, 100, 0.70),
        bucket(0.6, 0.7, 100, 0.75),
      ];
      const result = computePriorAdjustment(buckets, 0.30);
      const delta = Math.abs(result!.newPrior - 0.30);
      expect(delta).toBeLessThan(0.20); // damped, not raw
    });
  });
});
