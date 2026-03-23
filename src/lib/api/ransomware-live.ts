/**
 * Ransomware.live — Real-time ransomware attack tracking.
 * Tracks ransomware groups, recent victims, and attack trends.
 * Free, no API key required.
 * Docs: https://api.ransomware.live
 *
 * Source: JMousqueton/ransomware.live (310 stars)
 * Gap filled: First ransomware-specific feed. Existing cyber feeds track
 * IoCs/CVEs (nvd-cve, shodan, pulsedive) but not ransomware incidents.
 */

import type { IntelItem, Severity } from "@/types/intel";

const RANSOMWARE_API = "https://api.ransomware.live/v2";

interface RansomwareVictim {
  name: string;
  group: string;
  url: string;
  date: string;
  country?: string;
  sector?: string;
  description?: string;
}

interface RansomwareGroup {
  name: string;
  url: string;
  count: number;
  last_seen: string;
}

function groupToSeverity(group: string): Severity {
  // Major groups known for high-impact attacks
  const criticalGroups = ["lockbit", "alphv", "blackcat", "cl0p", "play", "blackbasta", "rhysida"];
  const highGroups = ["akira", "medusa", "bianlian", "hunters", "8base", "noescape"];

  const g = group.toLowerCase();
  if (criticalGroups.some((cg) => g.includes(cg))) return "critical";
  if (highGroups.some((hg) => g.includes(hg))) return "high";
  return "medium";
}

/**
 * Fetch recent ransomware victims.
 */
export async function fetchRansomwareVictims(): Promise<IntelItem[]> {
  try {
    const res = await fetch(`${RANSOMWARE_API}/recentvictims`, {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const victims: RansomwareVictim[] = await res.json();
    if (!Array.isArray(victims)) return [];

    return victims.slice(0, 20).map((v): IntelItem => ({
      id: `ransomware-${v.group}-${v.name}-${v.date}`.replace(/\s+/g, "-").toLowerCase(),
      title: `🔒 Ransomware: ${v.name} hit by ${v.group}`,
      summary: `Victim: ${v.name} | Group: ${v.group}${v.sector ? ` | Sector: ${v.sector}` : ""}${v.country ? ` | Country: ${v.country}` : ""} | Date: ${v.date}`,
      url: `https://www.ransomware.live/#/victims`,
      source: "Ransomware.live",
      category: "cyber",
      severity: groupToSeverity(v.group),
      publishedAt: new Date(v.date).toISOString() || new Date().toISOString(),
      countryCode: v.country?.slice(0, 2),
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch active ransomware groups.
 */
export async function fetchRansomwareGroups(): Promise<RansomwareGroup[]> {
  try {
    const res = await fetch(`${RANSOMWARE_API}/groups`, {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const groups = await res.json();
    return Array.isArray(groups) ? groups : [];
  } catch {
    return [];
  }
}
