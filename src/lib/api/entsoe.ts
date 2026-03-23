/**
 * ENTSO-E Transparency Platform — European electricity grid data.
 * Covers 35 countries: generation, cross-border flows, day-ahead prices.
 * Requires API key from https://transparency.entsoe.eu/
 * Docs: https://transparency.entsoe.eu/content/static_content/Static%20content/web%20api/Guide.html
 */

import type { IntelItem } from "@/types/intel";

const ENTSOE_API = "https://web-api.tp.entsoe.eu/api";

/** ENTSO-E area codes for major European bidding zones */
const AREA_CODES: Record<string, { name: string; code: string }> = {
  DE: { name: "Germany", code: "10Y1001A1001A83F" },
  FR: { name: "France", code: "10YFR-RTE------C" },
  ES: { name: "Spain", code: "10YES-REE------0" },
  IT: { name: "Italy (North)", code: "10Y1001A1001A73I" },
  NL: { name: "Netherlands", code: "10YNL----------L" },
  BE: { name: "Belgium", code: "10YBE----------2" },
  AT: { name: "Austria", code: "10YAT-APG------L" },
  PL: { name: "Poland", code: "10YPL-AREA-----S" },
  NO1: { name: "Norway (Oslo)", code: "10YNO-1--------2" },
  SE1: { name: "Sweden (North)", code: "10Y1001A1001A44P" },
  DK1: { name: "Denmark (West)", code: "10YDK-1--------W" },
  FI: { name: "Finland", code: "10YFI-1--------U" },
  PT: { name: "Portugal", code: "10YPT-REN------W" },
  GR: { name: "Greece", code: "10YGR-HTSO-----Y" },
  CZ: { name: "Czech Republic", code: "10YCZ-CEPS-----N" },
};

interface EntsoePrice {
  position: number;
  amount: number; // EUR/MWh
}

/**
 * Fetch day-ahead electricity prices for a European bidding zone.
 */
export async function fetchEntsoeDayAheadPrices(
  areaCode: string = AREA_CODES.DE.code,
): Promise<{ prices: EntsoePrice[]; area: string; date: string } | null> {
  const apiKey = process.env.ENTSOE_API_KEY;
  if (!apiKey) return null;

  const now = new Date();
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").slice(0, 12) + "00";

  try {
    const params = new URLSearchParams({
      securityToken: apiKey,
      documentType: "A44", // Day-ahead prices
      in_Domain: areaCode,
      out_Domain: areaCode,
      periodStart: fmt(start),
      periodEnd: fmt(end),
    });

    const res = await fetch(`${ENTSOE_API}?${params}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;

    const text = await res.text();
    // Parse XML response — extract price points
    const prices: EntsoePrice[] = [];
    const pointRegex = new RegExp("<Point>.*?<position>(\\d+)</position>.*?<price\\.amount>([\\d.]+)</price\\.amount>.*?</Point>", "gs");
    let match;
    while ((match = pointRegex.exec(text)) !== null) {
      prices.push({
        position: parseInt(match[1]),
        amount: parseFloat(match[2]),
      });
    }

    const areaName = Object.values(AREA_CODES).find((a) => a.code === areaCode)?.name || areaCode;

    return {
      prices,
      area: areaName,
      date: start.toISOString().slice(0, 10),
    };
  } catch {
    return null;
  }
}

/**
 * Fetch EU energy data as intel items — highlights price spikes and anomalies.
 */
export async function fetchEntsoeIntel(): Promise<IntelItem[]> {
  const apiKey = process.env.ENTSOE_API_KEY;
  if (!apiKey) return [];

  const items: IntelItem[] = [];

  for (const [code, area] of Object.entries(AREA_CODES).slice(0, 5)) {
    try {
      const data = await fetchEntsoeDayAheadPrices(area.code);
      if (!data || data.prices.length === 0) continue;

      const avg = data.prices.reduce((s, p) => s + p.amount, 0) / data.prices.length;
      const max = Math.max(...data.prices.map((p) => p.amount));
      const min = Math.min(...data.prices.map((p) => p.amount));

      const severity = max > 200 ? "high" : max > 100 ? "medium" : avg > 80 ? "low" : "info";

      items.push({
        id: `entsoe-${code}-${data.date}`,
        title: `${area.name} Electricity: €${avg.toFixed(1)}/MWh avg`,
        summary: `Day-ahead prices — Avg: €${avg.toFixed(1)}, Peak: €${max.toFixed(1)}, Low: €${min.toFixed(1)} EUR/MWh. ${max > 150 ? "⚠️ High price alert!" : ""}`,
        url: "https://transparency.entsoe.eu/",
        source: "ENTSO-E",
        category: "energy",
        severity,
        publishedAt: new Date().toISOString(),
        countryCode: code.slice(0, 2),
      });
    } catch {
      continue;
    }
  }

  return items;
}

export { AREA_CODES as ENTSOE_AREAS };
