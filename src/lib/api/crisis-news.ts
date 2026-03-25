/**
 * Crisis News Aggregator — Crisis/disaster news from RSS feeds.
 * Replaces: ReliefWeb API (now returns 403).
 * Uses crisis-focused RSS feeds instead.
 */

import type { IntelItem } from "@/types/intel";

const CRISIS_FEEDS = [
  { url: "https://news.un.org/feed/subscribe/en/news/topic/humanitarian-aid/feed/rss.xml", name: "UN Humanitarian" },
  { url: "https://www.preventionweb.net/rss/drr-news", name: "PreventionWeb" },
  { url: "https://www.irinnews.org/rss.xml", name: "The New Humanitarian" },
  { url: "https://reliefweb.int/headlines/rss.xml", name: "ReliefWeb Headlines" },
];

/**
 * Fetch latest crisis reports from RSS feeds.
 */
export async function fetchCrisisReports(): Promise<IntelItem[]> {
  try {
    const { fetchFeed } = await import("@/lib/api/rss-parser");

    const results = await Promise.allSettled(
      CRISIS_FEEDS.map((f) => fetchFeed(f.url, f.name))
    );

    const items: IntelItem[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") {
        items.push(...r.value.map((item) => ({
          ...item,
          category: "natural" as const,
        })));
      }
    }

    return items
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 20);
  } catch {
    return [];
  }
}
