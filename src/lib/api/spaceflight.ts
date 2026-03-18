import type { IntelItem } from "@/types/intel";
import { cachedFetch, TTL } from "@/lib/cache/redis";

/**
 * Spaceflight News API — Free, no API key required.
 * Latest spaceflight and aerospace news articles.
 * Docs: https://api.spaceflightnewsapi.net/v4/docs/
 */

const SNAPI = "https://api.spaceflightnewsapi.net/v4/articles";

interface SpaceflightArticle {
  id: number;
  title: string;
  summary: string;
  url: string;
  news_site: string;
  published_at: string;
  image_url?: string;
}

export async function fetchSpaceflightNews(
  limit = 15
): Promise<IntelItem[]> {
  return cachedFetch<IntelItem[]>(
    `spaceflight:news:${limit}`,
    async () => {
      try {
        const res = await fetch(
          `${SNAPI}?limit=${limit}&ordering=-published_at`,
          { signal: AbortSignal.timeout(10000) }
        );
        if (!res.ok) return [];

        const json = await res.json();
        const articles: SpaceflightArticle[] = json.results || [];

        return articles.map((a) => ({
          id: `snapi-${a.id}`,
          title: a.title,
          summary: a.summary?.slice(0, 300) || "",
          url: a.url,
          source: a.news_site,
          category: "tech" as const,
          severity: "info" as const,
          publishedAt: a.published_at,
          imageUrl: a.image_url,
        }));
      } catch {
        return [];
      }
    },
    TTL.NEWS
  );
}
