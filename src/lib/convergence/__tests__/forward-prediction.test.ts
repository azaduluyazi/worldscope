import { describe, expect, it } from "vitest";
import {
  predictFollowups,
  validatePredictions,
  predictionValidationRate,
} from "../forward-prediction";
import type { ClusterEvent } from "../types";

const NOW = new Date("2026-04-08T12:00:00Z").getTime();
const HOUR = 60 * 60 * 1000;

function makeEvent(opts: Partial<ClusterEvent> & Pick<ClusterEvent, "category">): ClusterEvent {
  return {
    eventId: opts.eventId ?? "trigger-1",
    sourceId: opts.sourceId ?? "kandilli",
    category: opts.category,
    severity: opts.severity ?? "high",
    reliability: opts.reliability ?? 0.9,
    title: opts.title ?? "test",
    lat: opts.lat ?? 0,
    lng: opts.lng ?? 0,
    publishedAt: opts.publishedAt ?? new Date(NOW - 5 * 60 * 1000).toISOString(),
  };
}

describe("forward-prediction", () => {
  describe("predictFollowups", () => {
    it("generates predictions from a high-confidence conflict trigger", () => {
      const trigger = makeEvent({ category: "conflict", reliability: 0.95 });
      const preds = predictFollowups(trigger, 0.85, NOW);
      expect(preds.length).toBeGreaterThan(0);
      // Conflict should predict at least energy or finance or diplomacy
      const cats = preds.map((p) => p.predictedCategory);
      expect(
        cats.includes("energy") || cats.includes("finance") || cats.includes("diplomacy")
      ).toBe(true);
    });

    it("returns empty for low-confidence triggers", () => {
      const trigger = makeEvent({ category: "conflict" });
      const preds = predictFollowups(trigger, 0.3, NOW);
      expect(preds).toEqual([]);
    });

    it("predictions are sorted by probability desc", () => {
      const trigger = makeEvent({ category: "conflict", reliability: 0.95 });
      const preds = predictFollowups(trigger, 0.9, NOW);
      for (let i = 1; i < preds.length; i++) {
        expect(preds[i - 1].probability).toBeGreaterThanOrEqual(preds[i].probability);
      }
    });

    it("each prediction has a valid expected window", () => {
      const trigger = makeEvent({ category: "conflict", reliability: 0.95 });
      const preds = predictFollowups(trigger, 0.85, NOW);
      for (const p of preds) {
        expect(p.expectedWindowMs).toBeGreaterThan(0);
        expect(new Date(p.expiresAt).getTime()).toBeGreaterThan(
          new Date(p.generatedAt).getTime()
        );
      }
    });

    it("filters out weak rules (probability < 0.55)", () => {
      const trigger = makeEvent({ category: "tech", reliability: 0.5 });
      const preds = predictFollowups(trigger, 0.5, NOW);
      // tech rules in impact-chain.ts have confidence 0.6 and 0.65,
      // multiplied by reliability 0.5 × triggerConfidence 0.5 → ~0.15-0.16 → all filtered
      expect(preds).toEqual([]);
    });
  });

  describe("validatePredictions", () => {
    it("matches a prediction whose category appeared within the window", () => {
      const trigger = makeEvent({ category: "conflict", reliability: 0.95 });
      const preds = predictFollowups(trigger, 0.85, NOW);
      const matchedCategory = preds[0].predictedCategory;

      const followupEvent = makeEvent({
        eventId: "followup-1",
        category: matchedCategory,
        publishedAt: new Date(NOW + 30 * 60 * 1000).toISOString(),
      });

      const results = validatePredictions(preds, [followupEvent], NOW + HOUR);
      expect(results[0].matched).toBe(true);
      expect(results[0].matchingEventId).toBe("followup-1");
    });

    it("does not match if window has expired", () => {
      const oldGen = new Date(NOW - 10 * HOUR).toISOString();
      const expired = new Date(NOW - 5 * HOUR).toISOString();
      const preds = [
        {
          predictedCategory: "energy" as const,
          probability: 0.85,
          expectedWindowMs: 5 * HOUR,
          reasoning: "x",
          triggerEventId: "t",
          generatedAt: oldGen,
          expiresAt: expired,
        },
      ];
      const followup = makeEvent({
        category: "energy",
        publishedAt: new Date(NOW - 60 * 1000).toISOString(),
      });
      const results = validatePredictions(preds, [followup], NOW);
      expect(results[0].matched).toBe(false);
    });

    it("does not match cross-category events", () => {
      const trigger = makeEvent({ category: "conflict", reliability: 0.95 });
      const preds = predictFollowups(trigger, 0.85, NOW);
      // tech is unlikely in conflict's outgoing rules
      const wrongCat = makeEvent({
        category: "sports",
        publishedAt: new Date(NOW + 30 * 60 * 1000).toISOString(),
      });
      const results = validatePredictions(preds, [wrongCat], NOW + HOUR);
      const sportsMatch = results.find((r) => r.matched);
      expect(sportsMatch).toBeUndefined();
    });
  });

  describe("predictionValidationRate", () => {
    it("returns 0 for empty input", () => {
      expect(predictionValidationRate([])).toBe(0);
    });

    it("returns the matched fraction", () => {
      const validations = [
        { prediction: {} as never, matched: true },
        { prediction: {} as never, matched: false },
        { prediction: {} as never, matched: true },
        { prediction: {} as never, matched: true },
      ];
      expect(predictionValidationRate(validations)).toBeCloseTo(0.75);
    });
  });
});
