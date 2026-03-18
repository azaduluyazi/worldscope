import type { PredictionMarket } from "@/types/tracking";

const GAMMA_BASE = "https://gamma-api.polymarket.com";

/** Fetch active prediction markets from Polymarket */
export async function fetchPredictionMarkets(limit = 20): Promise<PredictionMarket[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(
      `${GAMMA_BASE}/markets?limit=${limit}&active=true&closed=false&order=volume&ascending=false`,
      {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      }
    );

    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((m: Record<string, unknown>): PredictionMarket => ({
      id: String(m.id || m.condition_id || ""),
      question: String(m.question || m.title || ""),
      category: String(m.category || "general"),
      probability: Number(
        (Array.isArray(m.outcomePrices) ? m.outcomePrices[0] : null) ?? m.lastTradePrice ?? 0.5
      ),
      volume: Number(m.volume || m.volumeNum || 0),
      endDate: m.end_date_iso ? String(m.end_date_iso) : null,
      source: "polymarket",
      url: `https://polymarket.com/event/${m.slug || m.id}`,
    }));
  } catch {
    return [];
  }
}
