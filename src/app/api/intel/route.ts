import { NextResponse } from "next/server";
import { cachedFetch, TTL } from "@/lib/cache/redis";
import { fetchNewsApi } from "@/lib/api/newsapi";
import { fetchGNews } from "@/lib/api/gnews";
import { fetchFeed } from "@/lib/api/rss-parser";
import { MVP_FEEDS } from "@/config/feeds";
import type { IntelItem } from "@/types/intel";
import { SEVERITY_ORDER } from "@/types/intel";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await cachedFetch<IntelItem[]>(
      "intel:feed:world",
      async () => {
        const [newsApi, gNews, ...rssResults] = await Promise.allSettled([
          fetchNewsApi(),
          fetchGNews(),
          ...MVP_FEEDS.slice(0, 20).map((f) => fetchFeed(f.url, f.name)),
        ]);

        const allItems: IntelItem[] = [];

        if (newsApi.status === "fulfilled") allItems.push(...newsApi.value);
        if (gNews.status === "fulfilled") allItems.push(...gNews.value);
        for (const result of rssResults) {
          if (result.status === "fulfilled") allItems.push(...result.value);
        }

        // Deduplicate by title similarity
        const seen = new Set<string>();
        const unique = allItems.filter((item) => {
          const key = item.title.toLowerCase().slice(0, 60);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Sort by severity then recency
        unique.sort((a, b) => {
          const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
          if (sevDiff !== 0) return sevDiff;
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        });

        return unique.slice(0, 100);
      },
      TTL.NEWS
    );

    return NextResponse.json({
      items,
      lastUpdated: new Date().toISOString(),
      total: items.length,
    });
  } catch {
    return NextResponse.json(
      { items: [], lastUpdated: new Date().toISOString(), total: 0 },
      { status: 500 }
    );
  }
}
