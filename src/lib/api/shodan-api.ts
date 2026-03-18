/**
 * Shodan — Internet-connected device search (IoT, SCADA, servers)
 * https://developer.shodan.io/api
 */
import type { IntelItem } from "@/types/intel";

/** Fetch recent Shodan exploits/vulnerabilities */
export async function fetchShodanAlerts(): Promise<IntelItem[]> {
  const apiKey = process.env.SHODAN_API_KEY;
  if (!apiKey) return [];
  try {
    // Fetch honeypot activity summary
    const res = await fetch(
      `https://api.shodan.io/shodan/alert/info?key=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) {
      // Fallback: fetch general stats
      const statsRes = await fetch(
        `https://api.shodan.io/api-info?key=${apiKey}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!statsRes.ok) return [];
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.slice(0, 10).map((alert: Record<string, unknown>): IntelItem => ({
      id: `shodan-${alert.id || Date.now()}`,
      title: `Shodan Alert: ${String(alert.name || "Network Alert")}`,
      summary: `Filters: ${String(alert.filters || "?")} | Created: ${String(alert.created || "")}`,
      url: "https://www.shodan.io/dashboard",
      source: "Shodan",
      category: "cyber",
      severity: "medium",
      publishedAt: String(alert.created || new Date().toISOString()),
    }));
  } catch { return []; }
}
