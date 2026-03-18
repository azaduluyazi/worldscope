/**
 * Marketaux — Financial news and stock market data.
 * Requires MARKETAUX_API_KEY environment variable.
 * https://www.marketaux.com/documentation
 */
import type { IntelItem } from "@/types/intel";

interface MarketauxArticle {
  uuid: string;
  title: string;
  description: string;
  url: string;
  source: string;
  published_at: string;
  image_url: string | null;
  entities: Array<{
    symbol: string;
    name: string;
    country: string;
    sentiment_score: number;
  }>;
  relevance_score: number | null;
}

/**
 * Fetch financial news from Marketaux.
 * Gracefully returns [] when MARKETAUX_API_KEY is not set.
 */
export async function fetchMarketauxNews(
  symbols?: string,
  limit = 20,
): Promise<IntelItem[]> {
  const apiKey = process.env.MARKETAUX_API_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      api_token: apiKey,
      limit: String(limit),
      language: "en",
    });
    if (symbols) params.set("symbols", symbols);

    const res = await fetch(`https://api.marketaux.com/v1/news/all?${params}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const articles: MarketauxArticle[] = data?.data || [];

    return articles.map((article): IntelItem => {
      const textLower = `${article.title} ${article.description || ""}`.toLowerCase();
      const isCritical =
        /crash|collapse|recession|default|bankrupt|panic/.test(textLower);
      const isHigh =
        /plunge|surge|halt|sec|investigation|fraud|warning/.test(textLower);

      const entities = (article.entities || [])
        .map((e) => e.symbol)
        .join(", ");
      const summary = article.description
        ? article.description.slice(0, 250)
        : "";
      const entityNote = entities ? ` | Tickers: ${entities}` : "";

      return {
        id: `marketaux-${article.uuid || Date.now()}`,
        title: article.title,
        summary: `${summary}${entityNote}`.slice(0, 300),
        url: article.url,
        source: article.source || "Marketaux",
        category: "finance",
        severity: isCritical ? "critical" : isHigh ? "high" : "medium",
        publishedAt: article.published_at || new Date().toISOString(),
        imageUrl: article.image_url || undefined,
      };
    });
  } catch {
    return [];
  }
}
