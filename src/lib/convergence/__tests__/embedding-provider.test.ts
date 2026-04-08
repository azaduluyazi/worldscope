import { describe, expect, it } from "vitest";
import { cosineSimilarity } from "../embedding/provider";

describe("cosineSimilarity", () => {
  it("returns 1.0 for identical vectors", () => {
    const a = [1, 2, 3];
    expect(cosineSimilarity(a, a)).toBeCloseTo(1.0);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("returns -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [-1, -2, -3])).toBeCloseTo(-1);
  });

  it("returns the same value regardless of magnitude (direction-only)", () => {
    const a = [1, 2, 3];
    const scaled = [10, 20, 30];
    expect(cosineSimilarity(a, scaled)).toBeCloseTo(1.0);
  });

  it("throws on length mismatch", () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow(/length mismatch/);
  });

  it("returns 0 when either vector is zero", () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
  });

  it("handles realistic 768-dim embeddings", () => {
    const a = Array.from({ length: 768 }, (_, i) => Math.sin(i));
    const b = Array.from({ length: 768 }, (_, i) => Math.sin(i + 0.001));
    const sim = cosineSimilarity(a, b);
    expect(sim).toBeGreaterThan(0.99); // very similar but not identical
  });

  it("intermediate similarity is in [0, 1]", () => {
    const sim = cosineSimilarity([1, 2, 3], [3, 2, 1]);
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
  });
});
