/**
 * IFRC GO — International Red Cross disaster response API. No key required.
 * https://go.ifrc.org/api
 */

import type { IntelItem } from "@/types/intel";

const BASE = "https://goadmin.ifrc.org/api/v2";

/** Fetch recent IFRC emergency operations */
export async function fetchIFRCEmergencies(): Promise<IntelItem[]> {
  try {
    const res = await fetch(
      `${BASE}/appeal/?format=json&limit=15&ordering=-start_date&status=0`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];

    const data = await res.json();
    if (!data?.results) return [];

    return data.results.map((a: Record<string, unknown>): IntelItem => {
      const country = a.country as { name: string; iso: string } | null;
      return {
        id: `ifrc-${a.id || Date.now()}`,
        title: `IFRC: ${String(a.name || "Emergency Operation")}`,
        summary: `Type: ${(a.dtype as Record<string, string>)?.name || "Unknown"} | Amount: $${Number(a.amount_requested || 0).toLocaleString()} | Beneficiaries: ${Number(a.num_beneficiaries || 0).toLocaleString()}`,
        url: `https://go.ifrc.org/emergencies/${a.id}`,
        source: "IFRC Red Cross",
        category: "natural",
        severity: Number(a.num_beneficiaries || 0) > 100000 ? "critical" : Number(a.num_beneficiaries || 0) > 10000 ? "high" : "medium",
        publishedAt: String(a.start_date || new Date().toISOString()),
        countryCode: country?.iso,
      };
    });
  } catch {
    return [];
  }
}
