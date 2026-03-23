/**
 * EIA — US Energy Information Administration.
 * Petroleum, natural gas, coal, electricity production/consumption data.
 * Requires free API key from https://www.eia.gov/opendata/register.php
 * Docs: https://www.eia.gov/opendata/documentation.php
 */

import type { IntelItem } from "@/types/intel";

const EIA_API = "https://api.eia.gov/v2";

/** Key EIA series for energy monitoring */
const EIA_SERIES = {
  crudePriceWTI: { route: "petroleum/pri/spt/data", facets: { product: "EPCWTI", duoarea: "Y35NY" }, name: "WTI Crude Oil" },
  crudePriceBrent: { route: "petroleum/pri/spt/data", facets: { product: "EPCBRE" }, name: "Brent Crude" },
  naturalGasPrice: { route: "natural-gas/pri/fut/data", facets: { process: "FRP" }, name: "Natural Gas (Henry Hub)" },
  electricityGeneration: { route: "electricity/rto/fuel-type-data/data", facets: { respondent: "US48" }, name: "US Electricity Generation" },
  petroleumStocks: { route: "petroleum/stoc/wstk/data", facets: { product: "EPC0" }, name: "US Petroleum Stocks" },
};

type EiaSeries = keyof typeof EIA_SERIES;

interface EiaDataPoint {
  period: string;
  value: number;
  units: string;
}

/**
 * Fetch data from a specific EIA series.
 */
export async function fetchEiaSeries(
  series: EiaSeries,
  limit = 12,
): Promise<EiaDataPoint[]> {
  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) return [];

  const cfg = EIA_SERIES[series];

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      frequency: "weekly",
      "data[0]": "value",
      sort: JSON.stringify([{ column: "period", direction: "desc" }]),
      length: String(limit),
    });

    // Add facets
    for (const [key, val] of Object.entries(cfg.facets)) {
      params.append(`facets[${key}][]`, val);
    }

    const res = await fetch(`${EIA_API}/${cfg.route}?${params}`, {
      signal: AbortSignal.timeout(12000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const rows = data?.response?.data || [];

    return rows.map((r: Record<string, unknown>) => ({
      period: String(r.period || ""),
      value: Number(r.value || 0),
      units: String(r["value-units"] || r.units || ""),
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch energy market intel items.
 */
export async function fetchEiaIntel(): Promise<IntelItem[]> {
  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) return [];

  const items: IntelItem[] = [];

  const seriesToFetch: EiaSeries[] = ["crudePriceWTI", "crudePriceBrent", "naturalGasPrice"];

  for (const seriesKey of seriesToFetch) {
    try {
      const data = await fetchEiaSeries(seriesKey, 4);
      if (data.length < 2) continue;

      const latest = data[0];
      const prev = data[1];
      const change = latest.value - prev.value;
      const changePct = prev.value ? (change / prev.value) * 100 : 0;
      const direction = change > 0 ? "📈" : change < 0 ? "📉" : "➡️";

      const severity = Math.abs(changePct) > 10 ? "high" : Math.abs(changePct) > 5 ? "medium" : "info";

      items.push({
        id: `eia-${seriesKey}-${latest.period}`,
        title: `${direction} ${EIA_SERIES[seriesKey].name}: $${latest.value.toFixed(2)}`,
        summary: `${EIA_SERIES[seriesKey].name} at $${latest.value.toFixed(2)} ${latest.units} (${change > 0 ? "+" : ""}${changePct.toFixed(1)}% vs last week). Period: ${latest.period}`,
        url: "https://www.eia.gov/petroleum/",
        source: "EIA",
        category: "energy",
        severity,
        publishedAt: new Date().toISOString(),
        countryCode: "US",
      });
    } catch {
      continue;
    }
  }

  return items;
}
