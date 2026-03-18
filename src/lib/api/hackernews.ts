/**
 * HackerNews Firebase API — Tech pulse, no key required.
 * https://github.com/HackerNews/API
 */

import type { IntelItem } from "@/types/intel";

const HN_BASE = "https://hacker-news.firebaseio.com/v0";

interface HNItem {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
  descendants?: number;
}

/** Fetch top HackerNews stories as intel items */
export async function fetchHackerNews(limit = 15): Promise<IntelItem[]> {
  try {
    const res = await fetch(`${HN_BASE}/topstories.json`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];

    const ids: number[] = await res.json();
    const topIds = ids.slice(0, limit);

    const items = await Promise.allSettled(
      topIds.map(async (id) => {
        const r = await fetch(`${HN_BASE}/item/${id}.json`, {
          signal: AbortSignal.timeout(5000),
        });
        return r.ok ? (await r.json()) as HNItem : null;
      })
    );

    return items
      .filter((r): r is PromiseFulfilledResult<HNItem> => r.status === "fulfilled" && r.value !== null)
      .map((r): IntelItem => {
        const item = r.value;
        return {
          id: `hn-${item.id}`,
          title: item.title,
          summary: `Score: ${item.score} | Comments: ${item.descendants || 0} | By: ${item.by}`,
          url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
          source: "Hacker News",
          category: "tech",
          severity: item.score > 500 ? "high" : item.score > 200 ? "medium" : "low",
          publishedAt: new Date(item.time * 1000).toISOString(),
        };
      });
  } catch {
    return [];
  }
}
