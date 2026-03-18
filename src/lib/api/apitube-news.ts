/**
 * APITube News — Aggregated news from global sources.
 * Requires APITUBE_API_KEY environment variable.
 * https://apitube.io/
 */
import type { IntelItem } from "@/types/intel";

interface ApiTubeArticle {
  title: string;
  description: string;
  url: string;
  source: { name: string; url: string };
  publishedAt: string;
  image?: string;
  category?: string;
  language?: string;
}

const CATEGORY_MAP: Record<string, IntelItem["category"]> = {
  politics: "diplomacy",
  business: "finance",
  technology: "tech",
  science: "tech",
  health: "health",
  sports: "health",
  entertainment: "tech",
  world: "conflict",
  environment: "natural",
};

/**
 * Fetch news articles from APITube.
 * Gracefully returns [] when APITUBE_API_KEY is not set.
 */
export async function fetchApiTubeNews(
  query?: string,
  limit = 20,
): Promise<IntelItem[]> {
  const apiKey = process.env.APITUBE_API_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      limit: String(limit),
      sort: "published_at:desc",
    });
    if (query) params.set("q", query);

    const res = await fetch(`https://api.apitube.io/v1/news/everything?${params}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const articles: ApiTubeArticle[] = data?.articles || data?.data || [];

    return articles.map((article): IntelItem => {
      const textLower = `${article.title} ${article.description || ""}`.toLowerCase();
      const isCritical =
        /breaking|urgent|emergency|crisis|war|attack/.test(textLower);
      const isHigh =
        /killed|explosion|crash|collapse|outbreak/.test(textLower);

      return {
        id: `apitube-${Buffer.from(article.url).toString("base64url").slice(0, 24)}`,
        title: article.title,
        summary: (article.description || "").slice(0, 300),
        url: article.url,
        source: article.source?.name || "APITube",
        category: CATEGORY_MAP[article.category || ""] || "tech",
        severity: isCritical ? "critical" : isHigh ? "high" : "medium",
        publishedAt: article.publishedAt || new Date().toISOString(),
        imageUrl: article.image || undefined,
      };
    });
  } catch {
    return [];
  }
}
