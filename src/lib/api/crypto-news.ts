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
      `https://cryptopanic.com/api/v1/posts/?auth_token=${apiKey}&public=true&kind=news`,
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
    // /news endpoint is now Pro-only; use /search/trending (free)
    const res = await fetch("https://api.coingecko.com/api/v3/search/trending", {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const coins: Array<{ item: Record<string, unknown> }> = data?.coins || [];

    return coins.slice(0, 10).map((c, i): IntelItem => {
      const item = c.item;
      const priceChange = Number(item.data && (item.data as Record<string, unknown>).price_change_percentage_24h && ((item.data as Record<string, unknown>).price_change_percentage_24h as Record<string, number>)?.usd) || 0;
      const direction = priceChange > 0 ? "📈" : priceChange < 0 ? "📉" : "➡️";

      return {
        id: `cgk-trending-${item.id || i}`,
        title: `${direction} ${item.name} (${item.symbol}) — Trending #${Number(item.market_cap_rank) || i + 1}`,
        summary: `Score: ${Number(item.score) + 1}/10 | Market Cap Rank: #${item.market_cap_rank || "N/A"} | 24h: ${priceChange > 0 ? "+" : ""}${priceChange.toFixed(1)}%`,
        url: `https://www.coingecko.com/en/coins/${item.id}`,
        source: "CoinGecko",
        category: "finance",
        severity: Math.abs(priceChange) > 10 ? "medium" : "info",
        publishedAt: new Date().toISOString(),
        imageUrl: String(item.large || item.thumb || ""),
      };
    });
  } catch {
    return [];
  }
}
