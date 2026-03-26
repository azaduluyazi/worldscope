/**
 * ACLED (Armed Conflict Location & Event Data) API client.
 * Fetches real-time conflict event data worldwide.
 * https://acleddata.com/
 */

import type { IntelItem } from "@/types/intel";

const ACLED_API = "https://api.acleddata.com/acled/read";

const EVENT_TYPE_MAP: Record<string, { category: string; severity: string }> = {
  "Battles": { category: "conflict", severity: "high" },
  "Violence against civilians": { category: "conflict", severity: "critical" },
  "Explosions/Remote violence": { category: "conflict", severity: "critical" },
  "Riots": { category: "protest", severity: "high" },
  "Protests": { category: "protest", severity: "medium" },
  "Strategic developments": { category: "diplomacy", severity: "low" },
};

/** Escalate severity based on fatality count */
function escalateSeverity(baseSeverity: string, fatalities: number): string {
  if (fatalities >= 50) return "critical";
  if (fatalities >= 10) return "high";
  return baseSeverity;
}

export async function fetchAcledEvents(limit = 50): Promise<IntelItem[]> {
  const apiKey = process.env.ACLED_API_KEY;
  const email = process.env.ACLED_EMAIL;
  if (!apiKey || !email) return [];

  try {
    const params = new URLSearchParams({
      key: apiKey,
      email,
      limit: String(limit),
      event_date: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
      event_date_where: ">=",
    });

    const res = await fetch(`${ACLED_API}?${params}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return [];
    const json = await res.json();
    if (!json.data || !Array.isArray(json.data)) return [];

    return json.data.map((e: Record<string, string>) => {
      const mapping = EVENT_TYPE_MAP[e.event_type] || { category: "conflict", severity: "medium" };
      const fatalities = parseInt(e.fatalities || "0", 10) || 0;
      return {
        id: `acled-${e.event_id_cnty || e.data_id}`,
        title: `${e.event_type}: ${e.notes?.slice(0, 120) || e.sub_event_type || "Event"}`,
        summary: e.notes || "",
        source: "ACLED",
        category: mapping.category,
        severity: escalateSeverity(mapping.severity, fatalities),
        publishedAt: e.event_date ? new Date(e.event_date).toISOString() : new Date().toISOString(),
        lat: e.latitude ? parseFloat(e.latitude) : undefined,
        lng: e.longitude ? parseFloat(e.longitude) : undefined,
        country: e.country || undefined,
        url: `https://acleddata.com/dashboard/#/dashboard`,
      } as IntelItem;
    });
  } catch {
    return [];
  }
}
