import type { PowerOutage } from "@/types/tracking";

const ODIN_BASE = "https://ornl.opendatasoft.com/api/explore/v2.1/catalog/datasets/odin-real-time-outages-county/records";

/** Fetch US power outage data from ORNL ODIN (DOE open data) */
export async function fetchPowerOutages(limit = 50): Promise<PowerOutage[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const url = `${ODIN_BASE}?limit=${limit}&order_by=customers_out%20desc&where=customers_out%3E0`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data?.results) return [];

    return data.results.map((r: Record<string, unknown>): PowerOutage => ({
      state: String(r.state || ""),
      county: String(r.county || ""),
      utility: String(r.utility_name || "Unknown"),
      customersTracked: Number(r.customers_tracked || 0),
      customersOut: Number(r.customers_out || 0),
      outagePercentage: Number(r.customers_tracked) > 0
        ? Math.round((Number(r.customers_out) / Number(r.customers_tracked)) * 1000) / 10
        : 0,
      lastUpdate: String(r.recorded_date_time || new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}
