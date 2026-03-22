import type { IntelItem } from "@/types/intel";

/**
 * ArXiv API — Trending research papers.
 * Free, no API key. Rate limit: 1 req per 3 seconds.
 * Docs: https://info.arxiv.org/help/api/user-manual.html
 */

export async function fetchArxivPapers(
  category = "cs.AI",
  limit = 15
): Promise<IntelItem[]> {
  try {
    const res = await fetch(
      `https://export.arxiv.org/api/query?search_query=cat:${category}&sortBy=submittedDate&sortOrder=descending&max_results=${limit}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const text = await res.text();

    const entries = text.split("<entry>").slice(1);
    return entries.map((entry, idx) => {
      const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/\s+/g, " ").trim() || "Untitled";
      const summary = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.replace(/\s+/g, " ").trim() || "";
      const link = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1]?.trim() || "";
      const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.trim() || new Date().toISOString();

      return {
        id: `arxiv-${category}-${idx}`,
        title,
        summary: summary.slice(0, 300),
        url: link,
        source: "ArXiv",
        category: "tech" as const,
        severity: "low" as const,
        publishedAt: published,
      };
    });
  } catch {
    return [];
  }
}
