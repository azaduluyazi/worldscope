/**
 * National Weather Service (NWS) — US official weather alerts, no key required.
 * https://api.weather.gov/
 */

import type { IntelItem } from "@/types/intel";

const NWS_BASE = "https://api.weather.gov";

/** Fetch active US weather alerts */
export async function fetchNWSAlerts(): Promise<IntelItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${NWS_BASE}/alerts/active?status=actual&severity=Severe,Extreme`, {
      signal: controller.signal,
      headers: { Accept: "application/geo+json", "User-Agent": "WorldScope/1.0" },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data?.features) return [];

    return data.features.slice(0, 30).map((f: Record<string, unknown>, i: number): IntelItem => {
      const props = f.properties as Record<string, string>;
      return {
        id: `nws-${props.id || i}-${Date.now()}`,
        title: `${props.event || "Weather Alert"}: ${props.headline || ""}`.slice(0, 200),
        summary: (props.description || "").slice(0, 300),
        url: props.web || "https://weather.gov",
        source: "NWS",
        category: "natural",
        severity: props.severity === "Extreme" ? "critical" : "high",
        publishedAt: props.onset || props.sent || new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}
