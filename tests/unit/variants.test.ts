import { describe, it, expect } from "vitest";
import {
  VARIANTS,
  DEFAULT_VARIANT,
  getVariantCategories,
  filterFeedsByVariant,
} from "@/config/variants";

describe("VARIANTS config", () => {
  it("has exactly 3 variants: world, tech, finance", () => {
    expect(Object.keys(VARIANTS)).toEqual(["world", "tech", "finance"]);
  });

  it("default variant is world", () => {
    expect(DEFAULT_VARIANT).toBe("world");
  });

  it("each variant has required fields", () => {
    for (const v of Object.values(VARIANTS)) {
      expect(v.id).toBeTruthy();
      expect(v.name).toBeTruthy();
      expect(v.tagline).toBeTruthy();
      expect(v.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(v.primaryCategories.length).toBeGreaterThan(0);
      expect(v.keywords.length).toBeGreaterThan(0);
    }
  });

  it("no category appears in both primary and secondary", () => {
    for (const v of Object.values(VARIANTS)) {
      const overlap = v.primaryCategories.filter((c) =>
        v.secondaryCategories.includes(c)
      );
      expect(overlap).toEqual([]);
    }
  });
});

describe("getVariantCategories", () => {
  it("returns primary and all sets for world", () => {
    const { primary, all } = getVariantCategories("world");
    expect(primary.has("conflict")).toBe(true);
    expect(primary.has("finance")).toBe(false);
    expect(all.has("finance")).toBe(true); // secondary
    expect(all.has("conflict")).toBe(true); // primary also in all
  });

  it("tech variant prioritizes tech and cyber", () => {
    const { primary } = getVariantCategories("tech");
    expect(primary.has("tech")).toBe(true);
    expect(primary.has("cyber")).toBe(true);
    expect(primary.has("conflict")).toBe(false);
  });

  it("finance variant prioritizes finance and energy", () => {
    const { primary } = getVariantCategories("finance");
    expect(primary.has("finance")).toBe(true);
    expect(primary.has("energy")).toBe(true);
  });
});

describe("filterFeedsByVariant", () => {
  const feeds = [
    { category: "conflict" },
    { category: "cyber" },
    { category: "finance" },
    { category: "health" },
    { category: "aviation" },
  ];

  it("tech variant filters to tech-relevant categories", () => {
    const filtered = filterFeedsByVariant(feeds, "tech");
    const cats = filtered.map((f) => f.category);
    expect(cats).toContain("cyber");
    expect(cats).toContain("finance"); // secondary for tech
    expect(cats).toContain("conflict"); // secondary for tech
    expect(cats).not.toContain("health");
    expect(cats).not.toContain("aviation");
  });

  it("world variant includes most categories", () => {
    const filtered = filterFeedsByVariant(feeds, "world");
    // world has conflict, natural, diplomacy, protest, health as primary
    // and cyber, finance, tech, energy, aviation as secondary
    expect(filtered.length).toBe(5); // all 5 match world's categories
  });

  it("returns empty array when no feeds match", () => {
    const noMatch = [{ category: "unknown" }];
    const filtered = filterFeedsByVariant(noMatch, "tech");
    expect(filtered).toEqual([]);
  });
});
