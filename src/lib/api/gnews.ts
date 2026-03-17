import type { IntelItem } from "@/types/intel";
import { categorizeFeedItem, mapSeverity } from "./rss-parser";

interface GNewsArticle {
  title: string;
  description: string;
  url: string;
  source: { name: string };
  publishedAt: string;
  image: string | null;
}

export async function fetchGNews(topic?: string): Promise<IntelItem[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    token: apiKey,
    lang: "en",
    max: "20",
  });

  const endpoint = topic
    ? `https://gnews.io/api/v4/top-headlines?topic=${topic}&${params}`
    : `https://gnews.io/api/v4/top-headlines?${params}`;

  try {
    const res = await fetch(endpoint, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles || []).map((a: GNewsArticle): IntelItem => {
      const text = `${a.title} ${a.description}`;
      return {
        id: `gnews-${Buffer.from(a.url).toString("base64url").slice(0, 32)}`,
        title: a.title,
        summary: a.description?.slice(0, 300) || "",
        url: a.url,
        source: a.source.name,
        category: categorizeFeedItem(text),
        severity: mapSeverity(text),
        publishedAt: a.publishedAt,
        imageUrl: a.image || undefined,
      };
    });
  } catch {
    return [];
  }
}
