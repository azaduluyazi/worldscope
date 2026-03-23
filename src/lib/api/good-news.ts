/**
 * Good News Aggregator — Positive news for GoodScope.
 * Sources: Good News Network RSS + Positive.News + Reasons to be Cheerful
 * No API key required — uses RSS feeds.
 * Source: chandler767/Good-News-Machine (21 stars)
 * Gap filled: GoodScope had no dedicated positive news source.
 */

import type { IntelItem } from "@/types/intel";

interface GoodNewsSource {
  url: string;
  name: string;
  category: "tech" | "health" | "diplomacy";
}

const GOOD_NEWS_FEEDS: GoodNewsSource[] = [
  { url: "https://www.goodnewsnetwork.org/feed/", name: "Good News Network", category: "diplomacy" },
  { url: "https://reasonstobecheerful.world/feed/", name: "Reasons to be Cheerful", category: "diplomacy" },
  { url: "https://www.positive.news/feed/", name: "Positive News", category: "diplomacy" },
  { url: "https://singularityhub.com/feed/", name: "Singularity Hub", category: "tech" },
];

/**
 * Fetch positive news from RSS feeds.
 */
export async function fetchGoodNews(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];

  for (const feed of GOOD_NEWS_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        signal: AbortSignal.timeout(8000),
        headers: { Accept: "application/rss+xml, application/xml, text/xml" },
      });
      if (!res.ok) continue;

      const xml = await res.text();

      // Simple XML extraction — no dependency needed
      const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
      const titleRegex = /<title><!\[CDATA\[([\s\S]*?)\]\]>|<title>([\s\S]*?)<\/title>/i;
      const descRegex = /<description><!\[CDATA\[([\s\S]*?)\]\]>|<description>([\s\S]*?)<\/description>/i;
      const linkRegex = /<link>([\s\S]*?)<\/link>/i;
      const dateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/i;

      let match;
      let count = 0;
      while ((match = itemRegex.exec(xml)) !== null && count < 5) {
        const block = match[1];

        const titleMatch = titleRegex.exec(block);
        const title = (titleMatch?.[1] || titleMatch?.[2] || "").trim();
        if (!title) continue;

        const descMatch = descRegex.exec(block);
        const desc = (descMatch?.[1] || descMatch?.[2] || "")
          .replace(/<[^>]+>/g, "")
          .trim()
          .slice(0, 300);

        const linkMatch = linkRegex.exec(block);
        const link = (linkMatch?.[1] || "").trim();

        const dateMatch = dateRegex.exec(block);
        const pubDate = dateMatch?.[1]?.trim();

        items.push({
          id: `good-${feed.name.replace(/\s/g, "-").toLowerCase()}-${count}-${Date.now()}`,
          title: `🌟 ${title}`,
          summary: desc || title,
          url: link || feed.url,
          source: feed.name,
          category: feed.category,
          severity: "info",
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        });
        count++;
      }
    } catch {
      continue;
    }
  }

  return items;
}
