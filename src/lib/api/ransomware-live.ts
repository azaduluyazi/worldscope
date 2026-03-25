/**
 * Ransomware Tracking — RansomLook API (free, no key).
 * Tracks ransomware group activity and victim postings.
 * Replaces: ransomware.live (server down/timeout).
 */

import type { IntelItem, Severity } from "@/types/intel";

const RANSOMLOOK_API = "https://www.ransomlook.io/api/recent";

interface RansomPost {
  post_title: string;
  discovered: string;
  description: string;
  link: string;
  group_name: string;
}

function groupToSeverity(group: string): Severity {
  const criticalGroups = ["lockbit", "alphv", "blackcat", "cl0p", "play", "blackbasta", "rhysida"];
  const highGroups = ["akira", "medusa", "bianlian", "hunters", "8base", "noescape"];
  const g = group.toLowerCase();
  if (criticalGroups.some((cg) => g.includes(cg))) return "critical";
  if (highGroups.some((hg) => g.includes(hg))) return "high";
  return "medium";
}

/**
 * Fetch recent ransomware victim postings from RansomLook.
 */
export async function fetchRansomwareVictims(): Promise<IntelItem[]> {
  try {
    const res = await fetch(RANSOMLOOK_API, {
      signal: AbortSignal.timeout(12000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data: RansomPost[] = await res.json();
    if (!Array.isArray(data)) return [];

    return data.slice(0, 25).map((p, i): IntelItem => ({
      id: `ransomware-${p.group_name}-${i}-${Date.now()}`,
      title: `🔒 ${p.group_name}: ${p.post_title || "New victim"}`,
      summary: `Ransomware group "${p.group_name}" posted new victim${p.description ? `: ${p.description.slice(0, 200)}` : ""}`,
      url: p.link || "https://www.ransomlook.io",
      source: "RansomLook",
      category: "cyber",
      severity: groupToSeverity(p.group_name),
      publishedAt: p.discovered || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}
