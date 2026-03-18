/**
 * Currents API — Latest news from blogs, forums, outlets
 * https://currentsapi.services/en/docs/
 */
import type { IntelItem } from "@/types/intel";

export async function fetchCurrentsNews(limit = 15): Promise<IntelItem[]> {
  const apiKey = process.env.CURRENTS_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://api.currentsapi.services/v1/latest-news?apiKey=${apiKey}&language=en&page_size=${limit}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.news || []).map((a: Record<string, unknown>): IntelItem => ({
      id: `currents-${a.id || Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: String(a.title || ""),
      summary: String(a.description || "").slice(0, 300),
      url: String(a.url || ""),
      source: "Currents",
      category: mapCurrentsCategory(a.category as string[] || []),
      severity: "info",
      publishedAt: String(a.published || new Date().toISOString()),
    }));
  } catch { return []; }
}

function mapCurrentsCategory(cats: string[]): IntelItem["category"] {
  const joined = cats.join(" ").toLowerCase();
  if (joined.includes("tech")) return "tech";
  if (joined.includes("business") || joined.includes("finance")) return "finance";
  if (joined.includes("health")) return "health";
  if (joined.includes("science") || joined.includes("environment")) return "natural";
  if (joined.includes("politic")) return "diplomacy";
  return "conflict";
}
