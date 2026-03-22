import type { IntelItem } from "@/types/intel";

/**
 * Tzevaadom (Tzofar) API — Israel OREF rocket/missile alerts.
 * Globally accessible mirror — no Israeli IP required.
 * Source: https://www.tzevaadom.co.il/en/
 */

const TZEVAADOM_API = "https://api.tzevaadom.co.il/alerts-history";

interface TzevaadomAlert {
  id: number;
  alerts: Array<{
    time: number;
    cities: string[];
    threat: number;
    isDrill: boolean;
  }>;
}

export async function fetchOrefAlerts(limit = 20): Promise<IntelItem[]> {
  try {
    const res = await fetch(TZEVAADOM_API, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "WorldScope/1.0" },
    });
    if (!res.ok) return [];

    const data: TzevaadomAlert[] = await res.json();
    const items: IntelItem[] = [];

    for (const entry of data.slice(0, limit)) {
      for (const alert of entry.alerts) {
        if (alert.isDrill) continue;

        const cities = alert.cities.join(", ");
        const isHighThreat = alert.threat >= 5;

        items.push({
          id: `oref-${entry.id}-${alert.time}`,
          title: `Rocket Alert: ${cities}`,
          summary: `Missile/rocket alert in ${alert.cities.length} area(s): ${cities}`,
          url: "https://www.oref.org.il/",
          source: "OREF (Israel)",
          category: "conflict",
          severity: isHighThreat ? "critical" : "high",
          publishedAt: new Date(alert.time * 1000).toISOString(),
          lat: 31.5,
          lng: 34.8,
          countryCode: "IL",
        });
      }
    }

    return items;
  } catch {
    return [];
  }
}
