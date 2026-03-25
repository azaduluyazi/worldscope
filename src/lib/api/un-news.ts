/**
 * UN News — United Nations News RSS Feed.
 * Source: https://news.un.org/feed/subscribe/en/news/all/feed/rss.xml
 * No API key required.
 */

import type { IntelItem } from "@/types/intel";
import { fetchFeed } from "./rss-parser";

export async function fetchUnNews(): Promise<IntelItem[]> {
  try {
    const items = await fetchFeed(
      "https://news.un.org/feed/subscribe/en/news/all/feed/rss.xml",
      "UN News"
    );
    // Override category to diplomacy for UN news
    return items.map((item) => ({ ...item, category: "diplomacy" as const }));
  } catch {
    return [];
  }
}
