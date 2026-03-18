import type { IntelItem } from "@/types/intel";
import { categorizeFeedItem, mapSeverity } from "./rss-parser";

interface NewsApiArticle {
  title: string;
  description: string | null;
  url: string;
  source: { name: string };
  publishedAt: string;
  urlToImage: string | null;
}

export function mapNewsApiToIntel(article: NewsApiArticle): IntelItem {
  const text = `${article.title} ${article.description || ""}`;
  return {
    id: `newsapi-${Buffer.from(article.url).toString("base64url").slice(0, 32)}`,
    title: article.title,
    summary: article.description?.slice(0, 300) || "",
    url: article.url,
    source: article.source.name,
    category: categorizeFeedItem(text),
    severity: mapSeverity(text),
    publishedAt: article.publishedAt,
    imageUrl: article.urlToImage || undefined,
  };
}

// NewsAPI supported languages
const NEWSAPI_LANGS = new Set(["ar", "de", "en", "es", "fr", "it", "nl", "no", "pt", "ru", "sv", "zh"]);

export async function fetchNewsApi(query?: string, lang = "en"): Promise<IntelItem[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    apiKey,
    language: NEWSAPI_LANGS.has(lang) ? lang : "en",
    pageSize: "20",
    sortBy: "publishedAt",
  });

  if (query) {
    params.set("q", query);
  } else {
    params.set("q", "breaking OR crisis OR war OR market OR cyber");
  }

  try {
    const res = await fetch(`https://newsapi.org/v2/everything?${params}`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles || []).map(mapNewsApiToIntel);
  } catch {
    return [];
  }
}
