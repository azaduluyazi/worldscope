import type { IntelItem, Severity, Category } from "@/types/intel";
import { cachedFetch, TTL } from "@/lib/cache/redis";

/**
 * NewsData.io — News aggregator with sentiment analysis.
 * Requires API key (free tier: 200 requests/day).
 * Docs: https://newsdata.io/documentation
 */

const NEWSDATA_API = "https://newsdata.io/api/1/latest";

interface NewsDataArticle {
  article_id: string;
  title: string;
  description: string;
  link: string;
  source_id: string;
  pubDate: string;
  country: string[];
  category: string[];
  image_url?: string;
  sentiment?: string;
}

const CATEGORY_MAP: Record<string, Category> = {
  politics: "diplomacy",
  business: "finance",
  technology: "tech",
  science: "tech",
  health: "health",
  environment: "natural",
  world: "conflict",
  top: "conflict",
  crime: "conflict",
  sports: "diplomacy",
  entertainment: "diplomacy",
};

function mapSeverity(sentiment?: string): Severity {
  if (sentiment === "negative") return "high";
  if (sentiment === "positive") return "low";
  return "medium";
}

export async function fetchNewsData(limit = 20, lang = "en"): Promise<IntelItem[]> {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) return [];

  // Map locale to NewsData language codes
  const langMap: Record<string, string> = {
    en: "en", tr: "tr", ar: "ar", de: "de", es: "es", fr: "fr", ja: "ja", ko: "ko", ru: "ru", zh: "zh",
  };
  const newsLang = langMap[lang] || "en";

  return cachedFetch<IntelItem[]>(
    `newsdata:latest:${limit}:${newsLang}`,
    async () => {
      try {
        const params = new URLSearchParams({
          apikey: apiKey,
          language: newsLang,
          size: String(limit),
        });

        const res = await fetch(`${NEWSDATA_API}?${params}`, {
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return [];

        const json = await res.json();
        const articles: NewsDataArticle[] = json.results || [];

        return articles.map((a) => ({
          id: `newsdata-${a.article_id}`,
          title: a.title,
          summary: a.description?.slice(0, 300) || "",
          url: a.link,
          source: a.source_id,
          category: CATEGORY_MAP[a.category?.[0]] || ("diplomacy" as Category),
          severity: mapSeverity(a.sentiment),
          publishedAt: a.pubDate || new Date().toISOString(),
          imageUrl: a.image_url,
        }));
      } catch {
        return [];
      }
    },
    TTL.NEWS
  );
}
