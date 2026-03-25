/**
 * CoinTelegraph — Cryptocurrency News RSS Feed.
 * Source: https://cointelegraph.com/rss
 * No API key required.
 */

import type { IntelItem } from "@/types/intel";
import { fetchFeed } from "./rss-parser";

export async function fetchCoinTelegraph(): Promise<IntelItem[]> {
  try {
    const items = await fetchFeed("https://cointelegraph.com/rss", "CoinTelegraph");
    return items.map((item) => ({ ...item, category: "finance" as const }));
  } catch {
    return [];
  }
}
