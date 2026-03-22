/**
 * World Bank Indicators API — 16,000+ development indicators.
 * Free, no API key required.
 * Docs: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
 */

export interface WorldBankIndicator {
  country: string;
  countryCode: string;
  indicator: string;
  indicatorId: string;
  value: number | null;
  year: number;
}

const WB_BASE = "https://api.worldbank.org/v2";

export async function fetchWorldBankIndicator(
  indicatorId: string,
  year?: number
): Promise<WorldBankIndicator[]> {
  const y = year || new Date().getFullYear() - 1;
  try {
    const res = await fetch(
      `${WB_BASE}/country/all/indicator/${indicatorId}?format=json&date=${y}&per_page=300`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const data = await res.json();

    const records = data?.[1] || [];
    return records
      .filter((r: Record<string, unknown>) => r.value != null)
      .map((r: Record<string, unknown>) => ({
        country: (r.country as Record<string, string>)?.value || "",
        countryCode: String(r.countryiso3code || ""),
        indicator: (r.indicator as Record<string, string>)?.value || "",
        indicatorId: (r.indicator as Record<string, string>)?.id || indicatorId,
        value: r.value as number,
        year: parseInt(String(r.date)),
      }));
  } catch {
    return [];
  }
}

export const fetchPopulation = (year?: number) => fetchWorldBankIndicator("SP.POP.TOTL", year);
export const fetchGdpPerCapita = (year?: number) => fetchWorldBankIndicator("NY.GDP.PCAP.CD", year);
export const fetchUnemployment = (year?: number) => fetchWorldBankIndicator("SL.UEM.TOTL.ZS", year);
