/**
 * NY Times Top Stories API
 * https://developer.nytimes.com/docs/top-stories-product/1/overview
 */
import type { IntelItem } from "@/types/intel";

export async function fetchNYTTopStories(section = "world"): Promise<IntelItem[]> {
  const apiKey = process.env.NYT_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://api.nytimes.com/svc/topstories/v2/${section}.json?api-key=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.results || []).slice(0, 15).map((a: Record<string, unknown>): IntelItem => ({
      id: `nyt-${a.uri || Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: String(a.title || ""),
      summary: String(a.abstract || ""),
      url: String(a.url || ""),
      source: "NY Times",
      category: mapNYTSection(String(a.section || "")),
      severity: "info",
      publishedAt: String(a.published_date || new Date().toISOString()),
    }));
  } catch { return []; }
}

function mapNYTSection(s: string): IntelItem["category"] {
  const lower = s.toLowerCase();
  if (lower.includes("tech")) return "tech";
  if (lower.includes("business") || lower.includes("market")) return "finance";
  if (lower.includes("health")) return "health";
  if (lower.includes("science") || lower.includes("climate")) return "natural";
  return "diplomacy";
}
