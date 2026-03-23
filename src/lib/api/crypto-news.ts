/**
 * Crypto News Aggregator — Free crypto/blockchain news from multiple sources.
 * Inspired by nirholas/free-crypto-news.
 * Combines CryptoPanic + CoinTelegraph RSS for crypto-focused news.
 * CryptoPanic requires free API key from https://cryptopanic.com/developers/api/
 */

import type { IntelItem, Severity } from "@/types/intel";

interface CryptoPanicPost {
  id: number;
  title: string;
  url: string;
  source: { title: string; domain: string };
  published_at: string;
  currencies?: Array<{ code: string; title: string }>;
  kind: "news" | "media" | "analysis";
  votes: {
    positive: number;
    negative: number;
    important: number;
    liked: number;
    toxic: number;
    lol: number;
    saved: number;
  };
}

function votesToSeverity(votes: CryptoPanicPost["votes"], kind: string): Severity {
  if (votes.important > 5) return "high";
  if (votes.important > 2 || votes.positive > 10) return "medium";
  if (kind === "analysis") return "low";
  return "info";
}

/**
 * Fetch latest crypto news from CryptoPanic.
 */
export async function fetchCryptoPanicNews(): Promise<IntelItem[]> {
  const apiKey = process.env.CRYPTOPANIC_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://cryptopanic.com/api/free/v1/posts/?auth_token=${apiKey}&public=true&kind=news`,
      {
        signal: AbortSignal.timeout(8000),
        headers: { Accept: "application/json" },
      },
    );
    if (!res.ok) return [];

    const data = await res.json();
    const posts: CryptoPanicPost[] = data?.results || [];

    return posts.slice(0, 20).map((p): IntelItem => {
      const coins = p.currencies?.map((c) => c.code).join(", ") || "";

      return {
        id: `crypto-news-${p.id}`,
        title: p.title,
        summary: `${p.source.title}${coins ? ` | Coins: ${coins}` : ""} | ${p.kind}`,
        url: p.url,
        source: "CryptoPanic",
        category: "finance",
        severity: votesToSeverity(p.votes, p.kind),
        publishedAt: p.published_at,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Fetch crypto news without API key — uses CoinGecko news endpoint.
 */
export async function fetchCoinGeckoNews(): Promise<IntelItem[]> {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/news", {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const articles: Array<Record<string, unknown>> = data?.data || [];

    return articles.slice(0, 15).map((a): IntelItem => ({
      id: `cgk-news-${a.id || Date.now()}`,
      title: String(a.title || ""),
      summary: String(a.description || "").slice(0, 300),
      url: String(a.url || "https://coingecko.com"),
      source: String((a.news_site as string) || "CoinGecko"),
      category: "finance",
      severity: "info",
      publishedAt: String(a.updated_at || a.created_at || new Date().toISOString()),
      imageUrl: String(a.thumb_2x || a.large || ""),
    }));
  } catch {
    return [];
  }
}
