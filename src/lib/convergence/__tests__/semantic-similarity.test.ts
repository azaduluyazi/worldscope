import { describe, expect, it } from "vitest";
import {
  deduplicateBySemantics,
  findNearDuplicates,
  findSemanticBridges,
  type EmbeddedEvent,
} from "../semantic-similarity";

const NOW = new Date("2026-04-08T12:00:00Z").toISOString();

function makeEmbedded(
  id: string,
  embedding: number[],
  overrides: Partial<EmbeddedEvent> = {}
): EmbeddedEvent {
  return {
    eventId: id,
    sourceId: overrides.sourceId ?? "test",
    category: overrides.category ?? "natural",
    severity: overrides.severity ?? "high",
    reliability: overrides.reliability ?? 0.9,
    title: overrides.title ?? `event ${id}`,
    lat: overrides.lat ?? 0,
    lng: overrides.lng ?? 0,
    publishedAt: overrides.publishedAt ?? NOW,
    embedding,
  };
}

describe("semantic-similarity", () => {
  describe("findNearDuplicates", () => {
    it("returns empty when no events are near-duplicates", () => {
      const events = [
        makeEmbedded("a", [1, 0, 0]),
        makeEmbedded("b", [0, 1, 0]),
        makeEmbedded("c", [0, 0, 1]),
      ];
      const dupes = findNearDuplicates(events);
      expect(dupes.size).toBe(0);
    });

    it("groups identical embeddings together", () => {
      const events = [
        makeEmbedded("rep", [1, 0, 0]),
        makeEmbedded("dupe1", [1, 0, 0]),
        makeEmbedded("dupe2", [1, 0, 0]),
        makeEmbedded("other", [0, 1, 0]),
      ];
      const dupes = findNearDuplicates(events);
      expect(dupes.size).toBe(1);
      expect(dupes.get("rep")).toEqual(["dupe1", "dupe2"]);
    });

    it("ignores events without embeddings", () => {
      const events: EmbeddedEvent[] = [
        makeEmbedded("a", [1, 0, 0]),
        { ...makeEmbedded("b", [1, 0, 0]), embedding: undefined },
      ];
      const dupes = findNearDuplicates(events);
      expect(dupes.size).toBe(0);
    });

    it("respects custom threshold", () => {
      const a = makeEmbedded("a", [1, 0]);
      // A vector that's somewhat similar but below 0.92
      const b = makeEmbedded("b", [0.9, 0.4]);
      const dupesStrict = findNearDuplicates([a, b], 0.95);
      expect(dupesStrict.size).toBe(0);
      const dupesLoose = findNearDuplicates([a, b], 0.7);
      expect(dupesLoose.size).toBe(1);
    });
  });

  describe("deduplicateBySemantics", () => {
    it("removes near-duplicates and keeps representatives", () => {
      const events = [
        makeEmbedded("rep", [1, 0, 0]),
        makeEmbedded("dupe1", [1, 0, 0]),
        makeEmbedded("other", [0, 1, 0]),
      ];
      const out = deduplicateBySemantics(events);
      expect(out.length).toBe(2);
      const ids = out.map((e) => e.eventId);
      expect(ids).toContain("rep");
      expect(ids).toContain("other");
      expect(ids).not.toContain("dupe1");
    });

    it("returns input as-is when fewer than 2 events", () => {
      const single = [makeEmbedded("a", [1, 0])];
      expect(deduplicateBySemantics(single)).toEqual(single);
      expect(deduplicateBySemantics([])).toEqual([]);
    });
  });

  describe("findSemanticBridges", () => {
    it("returns pairs above the link threshold", () => {
      const events = [
        makeEmbedded("a", [1, 0, 0]),
        makeEmbedded("b", [0.95, 0.1, 0]),
        makeEmbedded("c", [0, 1, 0]),
      ];
      const bridges = findSemanticBridges(events);
      expect(bridges.length).toBeGreaterThanOrEqual(1);
      const ab = bridges.find((br) => br.a === "a" && br.b === "b");
      expect(ab).toBeDefined();
      expect(ab!.similarity).toBeGreaterThan(0.78);
    });

    it("sorts bridges strongest-first", () => {
      const events = [
        makeEmbedded("a", [1, 0, 0]),
        makeEmbedded("b", [0.99, 0.1, 0]),
        makeEmbedded("c", [0.85, 0.5, 0]),
      ];
      const bridges = findSemanticBridges(events, 0.7);
      for (let i = 1; i < bridges.length; i++) {
        expect(bridges[i - 1].similarity).toBeGreaterThanOrEqual(
          bridges[i].similarity
        );
      }
    });
  });
});
