import { describe, it, expect } from "vitest";
import {
  VARIANTS,
  DEFAULT_VARIANT,
  getVariantCategories,
  filterFeedsByVariant,
  type VariantId,
} from "@/config/variants";

describe("Variant System", () => {
  // ── Variant Config ──
  describe("VARIANTS config", () => {
    it("defines 11 variants including all scopes", () => {
      const keys = Object.keys(VARIANTS);
      expect(keys.length).toBe(11);
      expect(keys).toContain("world");
      expect(keys).toContain("sports");
      expect(keys).toContain("conflict");
    });

    it("default variant is world", () => {
      expect(DEFAULT_VARIANT).toBe("world");
    });

    it.each(["world", "tech", "finance"] as VariantId[])(
      "%s has all required fields",
      (id) => {
        const v = VARIANTS[id];
        expect(v.id).toBe(id);
        expect(v.name).toBeTruthy();
        expect(v.tagline).toBeTruthy();
        expect(v.description).toBeTruthy();
        expect(v.primaryCategories.length).toBeGreaterThan(0);
        expect(v.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(v.icon).toBeTruthy();
        expect(v.keywords.length).toBeGreaterThan(0);
      }
    );

    it("each variant has unique accent color", () => {
      const accents = Object.values(VARIANTS).map((v) => v.accent);
      expect(new Set(accents).size).toBe(accents.length);
    });
  });

  // ── Variant Accents ──
  describe("variant accents", () => {
    it("world accent is cyan (#00e5ff)", () => {
      expect(VARIANTS.world.accent).toBe("#00e5ff");
    });

    it("tech accent is purple (#8a5cf6)", () => {
      expect(VARIANTS.tech.accent).toBe("#8a5cf6");
    });

    it("finance accent is gold (#ffd000)", () => {
      expect(VARIANTS.finance.accent).toBe("#ffd000");
    });
  });

  // ── getVariantCategories ──
  describe("getVariantCategories", () => {
    it("world primary includes conflict, natural, diplomacy", () => {
      const { primary } = getVariantCategories("world");
      expect(primary.has("conflict")).toBe(true);
      expect(primary.has("natural")).toBe(true);
      expect(primary.has("diplomacy")).toBe(true);
    });

    it("world all includes both primary and secondary", () => {
      const { all } = getVariantCategories("world");
      expect(all.has("conflict")).toBe(true);
      expect(all.has("cyber")).toBe(true);
      expect(all.has("finance")).toBe(true);
    });

    it("tech primary is tech and cyber", () => {
      const { primary } = getVariantCategories("tech");
      expect(primary.has("tech")).toBe(true);
      expect(primary.has("cyber")).toBe(true);
      expect(primary.size).toBe(2);
    });

    it("tech all does not include health or natural", () => {
      const { all } = getVariantCategories("tech");
      expect(all.has("health")).toBe(false);
      expect(all.has("natural")).toBe(false);
    });

    it("finance primary is finance", () => {
      const { primary } = getVariantCategories("finance");
      expect(primary.has("finance")).toBe(true);
      expect(primary.size).toBe(1);
    });
  });

  // ── filterFeedsByVariant ──
  describe("filterFeedsByVariant", () => {
    const mockFeeds = [
      { category: "conflict", name: "BBC Conflict" },
      { category: "tech", name: "TechCrunch" },
      { category: "finance", name: "Bloomberg" },
      { category: "health", name: "WHO" },
      { category: "cyber", name: "HackerNews" },
      { category: "energy", name: "OilPrice" },
    ];

    it("world returns all feeds (all categories are primary or secondary)", () => {
      const filtered = filterFeedsByVariant(mockFeeds, "world");
      // world covers: conflict, natural, diplomacy, protest, health (primary)
      //             + cyber, finance, tech, energy, aviation (secondary) = all 10
      expect(filtered.length).toBe(mockFeeds.length);
    });

    it("tech filters to tech-relevant feeds only", () => {
      const filtered = filterFeedsByVariant(mockFeeds, "tech");
      const cats = filtered.map((f) => f.category);
      // tech: primary=tech,cyber; secondary=energy
      expect(cats).toContain("tech");
      expect(cats).toContain("cyber");
      expect(cats).toContain("energy");
      expect(cats).not.toContain("health");
    });

    it("finance filters to finance-relevant feeds only", () => {
      const filtered = filterFeedsByVariant(mockFeeds, "finance");
      const cats = filtered.map((f) => f.category);
      // finance: primary=finance; secondary=energy
      expect(cats).toContain("finance");
      expect(cats).toContain("energy");
      expect(cats).not.toContain("health");
      expect(cats).not.toContain("conflict");
    });

    it("returns empty for empty input", () => {
      expect(filterFeedsByVariant([], "world")).toEqual([]);
    });
  });
});
