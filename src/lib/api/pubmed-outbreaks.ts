/**
 * PubMed — Latest Outbreak Research via NCBI E-utilities.
 * Source: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/
 * No API key required (limited to 3 req/sec without key).
 */

import type { IntelItem } from "@/types/intel";

interface ESearchResult {
  esearchresult: {
    idlist: string[];
  };
}

interface ESummaryResult {
  result: Record<
    string,
    {
      uid: string;
      title?: string;
      source?: string;
      pubdate?: string;
      authors?: Array<{ name: string }>;
    }
  >;
}

const YEAR = new Date().getFullYear();
const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export async function fetchPubmedOutbreaks(): Promise<IntelItem[]> {
  try {
    const searchRes = await fetch(
      `${BASE}/esearch.fcgi?db=pubmed&retmode=json&retmax=10&term=disease+outbreak+${YEAR}&sort=date`,
      { signal: AbortSignal.timeout(10000), next: { revalidate: 3600 } }
    );
    if (!searchRes.ok) return [];
    const searchData: ESearchResult = await searchRes.json();
    const ids = searchData.esearchresult?.idlist || [];
    if (ids.length === 0) return [];

    const summaryRes = await fetch(
      `${BASE}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`,
      { signal: AbortSignal.timeout(10000), next: { revalidate: 3600 } }
    );
    if (!summaryRes.ok) return [];
    const summaryData: ESummaryResult = await summaryRes.json();
    const result = summaryData.result || {};

    return ids
      .filter((id) => result[id] && result[id].title)
      .map((id, idx) => {
        const paper = result[id];
        const authors = paper.authors?.slice(0, 2).map((a) => a.name).join(", ") || "";

        return {
          id: `pubmed-${id}-${idx}`,
          title: paper.title?.slice(0, 120) ?? `PubMed ${id}`,
          summary: `Source: ${paper.source || "N/A"} | Published: ${paper.pubdate || "N/A"}${authors ? " | " + authors : ""}`,
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
          source: "PubMed",
          category: "health" as const,
          severity: "medium" as const,
          publishedAt: paper.pubdate
            ? new Date(paper.pubdate).toISOString()
            : new Date().toISOString(),
        };
      });
  } catch {
    return [];
  }
}
