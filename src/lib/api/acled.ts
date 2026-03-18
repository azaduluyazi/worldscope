import type { IntelItem, Severity } from "@/types/intel";
import { cachedFetch, TTL } from "@/lib/cache/redis";

/**
 * ACLED (Armed Conflict Location & Event Data)
 * Provides real-time geo-coded conflict events — battles, protests, explosions.
 * Requires API key + email registration.
 * Docs: https://apidocs.acleddata.com/
 */

const ACLED_API = "https://api.acleddata.com/acled/read";

interface AcledEvent {
  event_id_cnty: string;
  event_date: string;
  event_type: string;
  sub_event_type: string;
  actor1: string;
  country: string;
  latitude: string;
  longitude: string;
  notes: string;
  fatalities: string;
  source: string;
  iso: number;
}

const EVENT_SEVERITY: Record<string, Severity> = {
  Battles: "high",
  "Explosions/Remote violence": "critical",
  "Violence against civilians": "critical",
  Protests: "medium",
  Riots: "high",
  "Strategic developments": "low",
};

const EVENT_CATEGORY: Record<string, string> = {
  Battles: "conflict",
  "Explosions/Remote violence": "conflict",
  "Violence against civilians": "conflict",
  Protests: "protest",
  Riots: "protest",
  "Strategic developments": "diplomacy",
};

export async function fetchAcledEvents(limit = 30): Promise<IntelItem[]> {
  const key = process.env.ACLED_API_KEY;
  const email = process.env.ACLED_EMAIL;
  if (!key || !email) return [];

  return cachedFetch<IntelItem[]>(
    `acled:events:${limit}`,
    async () => {
      try {
        const weekAgo = new Date(Date.now() - 7 * 86400000)
          .toISOString()
          .split("T")[0];
        const params = new URLSearchParams({
          key,
          email,
          event_date: weekAgo,
          event_date_where: ">=",
          limit: String(limit),
        });

        const res = await fetch(`${ACLED_API}?${params}`, {
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return [];

        const json = await res.json();
        const events: AcledEvent[] = json.data || [];

        return events.map((e) => {
          const fatalities = parseInt(e.fatalities) || 0;
          let severity = EVENT_SEVERITY[e.event_type] || ("medium" as Severity);
          if (fatalities >= 50) severity = "critical";
          else if (fatalities >= 10) severity = "high";

          return {
            id: `acled-${e.event_id_cnty}`,
            title: `${e.event_type}: ${e.sub_event_type} in ${e.country}`,
            summary: e.notes?.slice(0, 300) || "",
            url: `https://acleddata.com/dashboard/#/dashboard`,
            source: e.source || "ACLED",
            category: (EVENT_CATEGORY[e.event_type] ||
              "conflict") as IntelItem["category"],
            severity,
            publishedAt: new Date(e.event_date).toISOString(),
            lat: parseFloat(e.latitude) || undefined,
            lng: parseFloat(e.longitude) || undefined,
          };
        });
      } catch {
        return [];
      }
    },
    TTL.NEWS
  );
}
