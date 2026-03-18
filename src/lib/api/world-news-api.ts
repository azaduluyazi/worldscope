/**
 * World News API — Semantically tagged worldwide news search
 * https://worldnewsapi.com/
 */
import type { IntelItem } from "@/types/intel";
import { categorizeFeedItem, mapSeverity } from "./rss-parser";

export async function fetchWorldNews(lang = "en", limit = 15): Promise<IntelItem[]> {
  const apiKey = process.env.WORLDNEWS_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://api.worldnewsapi.com/search-news?api-key=${apiKey}&language=${lang}&number=${limit}&sort=publish-time&sort-direction=DESC`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.news || []).map((a: Record<string, unknown>): IntelItem => ({
      id: `worldnews-${a.id || Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      title: String(a.title || ""),
      summary: String(a.text || "").slice(0, 300),
      url: String(a.url || ""),
      source: String(a.source || "World News"),
      category: categorizeFeedItem(String(a.title || "")),
      severity: mapSeverity(String(a.title || "")),
      publishedAt: String(a.publish_date || new Date().toISOString()),
    }));
  } catch { return []; }
}
