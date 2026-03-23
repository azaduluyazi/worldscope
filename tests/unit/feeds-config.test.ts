import { describe, it, expect } from "vitest";
import { SEED_FEEDS } from "@/config/feeds";
import type { Category, Severity } from "@/types/intel";

const VALID_CATEGORIES: Category[] = [
  "conflict", "natural", "cyber", "finance", "tech",
  "health", "energy", "aviation", "diplomacy", "protest", "sports",
];

const VALID_SEVERITIES: Severity[] = [
  "critical", "high", "medium", "low", "info",
];

describe("SEED_FEEDS config", () => {
  it("has 300+ feeds", () => {
    expect(SEED_FEEDS.length).toBeGreaterThanOrEqual(300);
  });

  it("all feeds have required fields", () => {
    for (const feed of SEED_FEEDS) {
      expect(feed.name).toBeTruthy();
      expect(feed.url).toBeTruthy();
      expect(VALID_CATEGORIES).toContain(feed.category);
      expect(VALID_SEVERITIES).toContain(feed.defaultSeverity);
    }
  });

  it("all feed URLs are valid", () => {
    for (const feed of SEED_FEEDS) {
      expect(() => new URL(feed.url)).not.toThrow();
    }
  });

  it("no duplicate URLs", () => {
    const urls = SEED_FEEDS.map((f) => f.url);
    const unique = new Set(urls);
    expect(unique.size).toBe(urls.length);
  });

  // Sports data comes from APIs (ESPN, Football Data, F1), not RSS feeds
  const RSS_CATEGORIES = VALID_CATEGORIES.filter((c) => c !== "sports");

  it("covers all RSS-based categories", () => {
    const coveredCategories = new Set(SEED_FEEDS.map((f) => f.category));
    for (const cat of RSS_CATEGORIES) {
      expect(coveredCategories.has(cat)).toBe(true);
    }
  });

  it("each RSS category has at least 5 feeds", () => {
    for (const cat of RSS_CATEGORIES) {
      const count = SEED_FEEDS.filter((f) => f.category === cat).length;
      expect(count).toBeGreaterThanOrEqual(5);
    }
  });
});
