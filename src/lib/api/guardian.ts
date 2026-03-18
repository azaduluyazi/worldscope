/**
 * The Guardian Open Platform API
 * https://content.guardianapis.com/
 */
import type { IntelItem } from "@/types/intel";

export async function fetchGuardianNews(limit = 15): Promise<IntelItem[]> {
  const apiKey = process.env.GUARDIAN_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://content.guardianapis.com/search?api-key=${apiKey}&page-size=${limit}&order-by=newest&section=world|politics|business|technology|environment&show-fields=trailText`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.response?.results || []).map((a: Record<string, unknown>): IntelItem => ({
      id: `guardian-${a.id || Date.now()}`,
      title: String(a.webTitle || ""),
      summary: String((a.fields as Record<string, string>)?.trailText || ""),
      url: String(a.webUrl || ""),
      source: "The Guardian",
      category: mapSection(String(a.sectionId || "")),
      severity: "info",
      publishedAt: String(a.webPublicationDate || new Date().toISOString()),
    }));
  } catch { return []; }
}

function mapSection(s: string): IntelItem["category"] {
  if (s.includes("tech")) return "tech";
  if (s.includes("business")) return "finance";
  if (s.includes("environment")) return "natural";
  return "diplomacy";
}
