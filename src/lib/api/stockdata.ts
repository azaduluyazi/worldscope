/**
 * StockData — Market data + news + sentiment
 * https://www.stockdata.org/
 */
import type { IntelItem } from "@/types/intel";

export async function fetchStockDataNews(limit = 10): Promise<IntelItem[]> {
  const apiKey = process.env.STOCKDATA_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://api.stockdata.org/v1/news/all?api_token=${apiKey}&language=en&limit=${limit}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data || []).map((a: Record<string, unknown>): IntelItem => ({
      id: `stockdata-${a.uuid || Date.now()}`,
      title: String(a.title || ""),
      summary: String(a.description || "").slice(0, 300),
      url: String(a.url || ""),
      source: String(a.source || "StockData"),
      category: "finance",
      severity: "info",
      publishedAt: String(a.published_at || new Date().toISOString()),
    }));
  } catch { return []; }
}
