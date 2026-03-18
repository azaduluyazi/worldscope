/**
 * NewsAPI.ai — Real-time and archive news access
 * https://newsapi.ai/
 */
import type { IntelItem } from "@/types/intel";
import { categorizeFeedItem, mapSeverity } from "./rss-parser";

export async function fetchNewsApiAi(lang = "eng", limit = 15): Promise<IntelItem[]> {
  const apiKey = process.env.NEWSAPI_AI_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://newsapi.ai/api/v1/article/getArticles?apiKey=${apiKey}&lang=${lang}&articlesSortBy=date&articlesCount=${limit}&resultType=articles`,
      { signal: AbortSignal.timeout(10000), method: "GET" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.articles?.results || []).map((a: Record<string, unknown>): IntelItem => ({
      id: `newsapiai-${a.uri || Date.now()}`,
      title: String(a.title || ""),
      summary: String(a.body || "").slice(0, 300),
      url: String(a.url || ""),
      source: String((a.source as Record<string, string>)?.title || "NewsAPI.ai"),
      category: categorizeFeedItem(String(a.title || "")),
      severity: mapSeverity(String(a.title || "")),
      publishedAt: String(a.dateTimePub || new Date().toISOString()),
    }));
  } catch { return []; }
}
