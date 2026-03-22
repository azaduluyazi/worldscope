import type { IntelItem } from "@/types/intel";

/**
 * UCDP (Uppsala Conflict Data Program) — Georeferenced conflict events.
 * Free token optional (email ucdp@pcr.uu.se). Works without token.
 * Docs: https://ucdp.uu.se/apidocs/
 */

const UCDP_BASE = "https://ucdpapi.pcr.uu.se/api/gedevents/25.1";

export async function fetchUcdpEvents(limit = 30): Promise<IntelItem[]> {
  try {
    const headers: Record<string, string> = {};
    const token = process.env.UCDP_API_TOKEN;
    if (token) headers["x-ucdp-access-token"] = token;

    const res = await fetch(
      `${UCDP_BASE}?pagesize=${limit}&page=0`,
      { signal: AbortSignal.timeout(10000), headers }
    );
    if (!res.ok) return [];
    const data = await res.json();

    const results: Record<string, unknown>[] = data?.Result || [];
    return results.map((e) => {
      const best = Number(e.best) || 0;
      return {
        id: `ucdp-${e.id}`,
        title: `${e.type_of_violence_text || "Conflict"}: ${e.country || "Unknown"} — ${e.side_a || ""} vs ${e.side_b || ""}`,
        summary: `${String(e.source_article || "").slice(0, 250)} (${best} fatalities)`,
        url: `https://ucdp.uu.se/event/${e.id}`,
        source: "UCDP",
        category: "conflict" as const,
        severity: best >= 25 ? "critical" : best >= 10 ? "high" : "medium",
        publishedAt: String(e.date_start || new Date().toISOString()),
        lat: e.latitude ? parseFloat(String(e.latitude)) : undefined,
        lng: e.longitude ? parseFloat(String(e.longitude)) : undefined,
        countryCode: String(e.country_id || ""),
      };
    });
  } catch {
    return [];
  }
}
