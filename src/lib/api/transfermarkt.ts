/**
 * Football Transfers — Transfer news via RSS feeds.
 * Replaces: transfermarkt-api.fly.dev (all endpoints 404/405).
 * Uses football transfer RSS feeds as reliable alternative.
 */

import type { IntelItem } from "@/types/intel";

// Transfer news RSS feeds
const TRANSFER_FEEDS = [
  "https://www.skysports.com/rss/12040", // Sky Sports Transfers
  "https://www.90min.com/posts.rss",      // 90min football
];

/**
 * Fetch latest transfer news from RSS feeds.
 */
export async function fetchLatestTransfers(): Promise<IntelItem[]> {
  try {
    const { fetchFeed } = await import("@/lib/api/rss-parser");

    const results = await Promise.allSettled(
      TRANSFER_FEEDS.map((url, i) =>
        fetchFeed(url, i === 0 ? "Sky Sports Transfers" : "90min Football")
      )
    );

    const items: IntelItem[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") {
        items.push(...r.value.map((item) => ({
          ...item,
          category: "sports" as const,
        })));
      }
    }

    return items.slice(0, 15);
  } catch {
    return [];
  }
}

/**
 * Combined Transfermarkt intel — now RSS-based.
 */
export async function fetchTransfermarktIntel(): Promise<IntelItem[]> {
  return fetchLatestTransfers();
}
