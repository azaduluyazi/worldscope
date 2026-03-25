/**
 * Positive News — Uplifting World News RSS Feed.
 * Source: https://www.positive.news/feed/
 * No API key required.
 */

import type { IntelItem } from "@/types/intel";
import { fetchFeed } from "./rss-parser";

export async function fetchPositiveNews(): Promise<IntelItem[]> {
  try {
    const items = await fetchFeed("https://www.positive.news/feed/", "Positive News");
    return items.map((item) => ({
      ...item,
      category: "diplomacy" as const,
      severity: "info" as const,
    }));
  } catch {
    return [];
  }
}
