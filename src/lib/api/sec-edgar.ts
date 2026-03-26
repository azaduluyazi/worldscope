/**
 * SEC EDGAR — U.S. Securities and Exchange Commission filings.
 * Free, no API key required (requires User-Agent with contact info).
 * https://efts.sec.gov/LATEST/search-index
 */

import type { IntelItem, Severity } from "@/types/intel";

interface EdgarFiling {
  file_num: string;
  film_num: string;
  form_type: string;
  file_date: string;
  company_name: string;
  cik: string;
  file_url: string;
  period_of_report: string;
}

interface EdgarSearchResponse {
  hits: {
    total: { value: number };
    hits: Array<{
      _id: string;
      _source: EdgarFiling;
    }>;
  };
}

function formTypeToSeverity(formType: string): Severity {
  const type = formType.toUpperCase();
  // Major filings that move markets
  if (type === "8-K" || type === "6-K") return "high";
  if (type === "10-K" || type === "20-F") return "medium";
  if (type === "10-Q") return "medium";
  if (type.includes("S-1") || type.includes("IPO")) return "high";
  if (type === "13F" || type === "SC 13D") return "medium";
  return "info";
}

/**
 * Search SEC EDGAR for recent filings.
 * Returns matched filings as IntelItems.
 */
export async function fetchSecFilings(
  query = "annual report",
  limit = 20
): Promise<IntelItem[]> {
  try {
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startdt = startDate.toISOString().split("T")[0];
    const enddt = now.toISOString().split("T")[0];

    const params = new URLSearchParams({
      q: query,
      dateRange: "custom",
      startdt,
      enddt,
      from: "0",
      size: String(limit),
    });

    const res = await fetch(
      `https://efts.sec.gov/LATEST/search-index?${params}`,
      {
        signal: AbortSignal.timeout(10000),
        headers: {
          Accept: "application/json",
          "User-Agent": "WorldScope admin@troiamedia.com",
        },
      }
    );
    if (!res.ok) {
      // Fallback to full-text search endpoint
      return await fetchSecFullTextSearch(query, limit);
    }

    const data: EdgarSearchResponse = await res.json();
    if (!data.hits?.hits) return [];

    return data.hits.hits.map((hit): IntelItem => {
      const filing = hit._source;
      return {
        id: `sec-${hit._id || filing.file_num}`,
        title: `SEC ${filing.form_type}: ${filing.company_name}`,
        summary: `CIK: ${filing.cik} | Filed: ${filing.file_date} | Period: ${filing.period_of_report || "N/A"}`,
        url: filing.file_url
          ? `https://www.sec.gov${filing.file_url}`
          : `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${filing.cik}`,
        source: "SEC EDGAR",
        category: "finance",
        severity: formTypeToSeverity(filing.form_type),
        publishedAt: filing.file_date
          ? `${filing.file_date}T00:00:00Z`
          : new Date().toISOString(),
        countryCode: "US",
      };
    });
  } catch {
    return [];
  }
}

/**
 * Fallback: Full-text search via EDGAR EFTS API.
 */
async function fetchSecFullTextSearch(query: string, limit: number): Promise<IntelItem[]> {
  try {
    const params = new URLSearchParams({
      q: `"${query}"`,
      forms: "10-K,8-K,10-Q",
    });

    const res = await fetch(
      `https://efts.sec.gov/LATEST/search-index?${params}&from=0&size=${limit}`,
      {
        signal: AbortSignal.timeout(10000),
        headers: {
          Accept: "application/json",
          "User-Agent": "WorldScope admin@troiamedia.com",
        },
      }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const filings = data.hits?.hits || [];

    return filings.map((hit: { _id: string; _source: EdgarFiling }): IntelItem => ({
      id: `sec-fts-${hit._id}`,
      title: `SEC Filing: ${hit._source.company_name || "Unknown"} (${hit._source.form_type})`,
      summary: `Filed: ${hit._source.file_date}`,
      url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${hit._source.cik}`,
      source: "SEC EDGAR",
      category: "finance",
      severity: "info",
      publishedAt: hit._source.file_date ? `${hit._source.file_date}T00:00:00Z` : new Date().toISOString(),
      countryCode: "US",
    }));
  } catch {
    return [];
  }
}
