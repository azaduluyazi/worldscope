/**
 * Pulsedive — Threat intelligence platform for IPs, domains, URLs.
 * Requires PULSEDIVE_API_KEY environment variable.
 * https://pulsedive.com/api/
 */

export interface PulsediveIndicator {
  iid: number;
  indicator: string;
  type: string; // "ip" | "domain" | "url"
  risk: string; // "none" | "low" | "medium" | "high" | "critical" | "unknown"
  riskRecommended: string;
  manuallyRisk: boolean;
  retired: boolean;
  stamp_added: string;
  stamp_updated: string;
  stamp_seen: string;
  summary: {
    properties: Record<string, unknown>;
    threats: Array<{ name: string; category: string }>;
  };
}

export interface PulsediveFeed {
  fid: number;
  name: string;
  category: string;
  organization: string;
  indicators: number;
}

/**
 * Look up an indicator (IP, domain, or URL) in Pulsedive.
 * Gracefully returns null when PULSEDIVE_API_KEY is not set.
 */
export async function fetchPulsediveIndicator(
  indicator: string,
): Promise<PulsediveIndicator | null> {
  const apiKey = process.env.PULSEDIVE_API_KEY;
  if (!apiKey) return null;
  if (!indicator) return null;

  try {
    const params = new URLSearchParams({
      indicator: indicator,
      pretty: "1",
      key: apiKey,
    });
    const res = await fetch(`https://pulsedive.com/api/info.php?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.error) return null;

    return {
      iid: Number(data.iid || 0),
      indicator: String(data.indicator || indicator),
      type: String(data.type || "unknown"),
      risk: String(data.risk || "unknown"),
      riskRecommended: String(data.risk_recommended || "unknown"),
      manuallyRisk: Boolean(data.manualrisk),
      retired: Boolean(data.retired),
      stamp_added: String(data.stamp_added || ""),
      stamp_updated: String(data.stamp_updated || ""),
      stamp_seen: String(data.stamp_seen || ""),
      summary: {
        properties: data.properties || {},
        threats: Array.isArray(data.threats) ? data.threats : [],
      },
    };
  } catch {
    return null;
  }
}

/** Fetch recent threat feeds from Pulsedive */
export async function fetchPulsediveFeeds(): Promise<PulsediveFeed[]> {
  const apiKey = process.env.PULSEDIVE_API_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({ pretty: "1", key: apiKey });
    const res = await fetch(`https://pulsedive.com/api/info.php?feed=list&${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.slice(0, 20).map((f: Record<string, unknown>): PulsediveFeed => ({
      fid: Number(f.fid || 0),
      name: String(f.feed || ""),
      category: String(f.category || ""),
      organization: String(f.organization || ""),
      indicators: Number(f.indicators || 0),
    }));
  } catch {
    return [];
  }
}
