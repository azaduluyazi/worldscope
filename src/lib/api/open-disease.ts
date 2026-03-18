/**
 * Open Disease Data — Extended disease intelligence.
 * Wraps disease.sh influenza data alongside the existing COVID module.
 * Free, no API key required.
 * https://disease.sh/docs
 */

import type { IntelItem, Severity } from "@/types/intel";

interface InfluenzaCountry {
  country: string;
  data: Array<{
    year: number;
    week: number;
    /** Total number of specimens processed */
    processed: number;
    /** Number of positive specimens */
    positive: number;
    /** Influenza A */
    inf_a: number;
    /** Influenza B */
    inf_b: number;
  }>;
}

function positivityToSeverity(positive: number, processed: number): Severity {
  if (processed === 0) return "info";
  const rate = positive / processed;
  if (rate >= 0.3) return "critical";
  if (rate >= 0.15) return "high";
  if (rate >= 0.05) return "medium";
  if (rate > 0) return "low";
  return "info";
}

/**
 * Fetch influenza surveillance data from disease.sh IHF endpoint.
 * Returns country-level influenza data as IntelItems.
 */
export async function fetchInfluenzaData(limit = 20): Promise<IntelItem[]> {
  try {
    const res = await fetch(
      "https://disease.sh/v3/influenza/ihf/countries",
      {
        signal: AbortSignal.timeout(10000),
        headers: {
          Accept: "application/json",
          "User-Agent": "WorldScope/1.0",
        },
      }
    );
    if (!res.ok) return [];

    const data: InfluenzaCountry[] = await res.json();
    if (!Array.isArray(data)) return [];

    const items: IntelItem[] = [];

    for (const country of data) {
      if (!country.data || country.data.length === 0) continue;

      // Get the most recent week's data
      const latest = country.data[country.data.length - 1];
      if (!latest || latest.positive === 0) continue;

      items.push({
        id: `influenza-${country.country}-w${latest.week}-${latest.year}`,
        title: `Influenza Surveillance: ${country.country} — ${latest.positive} positive`,
        summary: `Week ${latest.week}/${latest.year} | Processed: ${latest.processed} | Positive: ${latest.positive} | Inf A: ${latest.inf_a} | Inf B: ${latest.inf_b}`,
        url: "https://disease.sh/docs/#/Influenza",
        source: "Disease.sh/Influenza",
        category: "health",
        severity: positivityToSeverity(latest.positive, latest.processed),
        publishedAt: new Date().toISOString(),
      });
    }

    // Sort by positive count descending, return top results
    return items
      .sort((a, b) => {
        const aPos = parseInt(a.summary.match(/Positive: (\d+)/)?.[1] || "0");
        const bPos = parseInt(b.summary.match(/Positive: (\d+)/)?.[1] || "0");
        return bPos - aPos;
      })
      .slice(0, limit);
  } catch {
    return [];
  }
}
