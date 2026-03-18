/**
 * Federal Register — US executive orders, rules, regulations. No key required.
 * https://www.federalregister.gov/developers/documentation/api/v1
 */

import type { IntelItem } from "@/types/intel";

const BASE = "https://www.federalregister.gov/api/v1";

/** Fetch recent significant federal documents */
export async function fetchFederalRegister(): Promise<IntelItem[]> {
  try {
    const res = await fetch(
      `${BASE}/documents.json?per_page=15&order=newest&conditions[type][]=PRESDOCU&conditions[type][]=RULE&conditions[significant]=1`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];

    const data = await res.json();
    if (!data?.results) return [];

    return data.results.map((doc: Record<string, unknown>): IntelItem => ({
      id: `fedreg-${doc.document_number || Date.now()}`,
      title: String(doc.title || "Federal Register Document"),
      summary: `${doc.type || "Document"} | Agency: ${(doc.agencies as Array<{ name: string }>)?.[0]?.name || "Unknown"} | Published: ${doc.publication_date || ""}`,
      url: String(doc.html_url || "https://www.federalregister.gov/"),
      source: "Federal Register",
      category: "diplomacy",
      severity: doc.type === "Presidential Document" ? "high" : "medium",
      publishedAt: String(doc.publication_date || new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}
