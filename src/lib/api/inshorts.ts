/**
 * Inshorts-style short news — aggregated from positive/upbeat RSS sources.
 * Sources: Positive News + Good News Network
 * No API key required.
 */

import type { IntelItem } from "@/types/intel";
import { fetchFeed } from "./rss-parser";

const FEEDS = [
  { url: "https://www.positive.news/feed/", name: "Positive News" },
  { url: "https://www.goodnewsnetwork.org/feed/", name: "Good News Network" },
];

export async function fetchInshortsNews(): Promise<IntelItem[]> {
  try {
    const results = await Promise.allSettled(
      FEEDS.map((f) => fetchFeed(f.url, f.name))
    );

    const all: IntelItem[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        all.push(...result.value);
      }
    }

    return all
      .map((item) => ({
        ...item,
        category: "diplomacy" as const,
        severity: "info" as const,
      }))
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
      .slice(0, 20);
  } catch {
    return [];
  }
}
