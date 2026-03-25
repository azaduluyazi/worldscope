/**
 * RansomLook — Recent Ransomware Victims.
 * Source: https://www.ransomlook.io/api/recent
 * No API key required.
 */

import type { IntelItem } from "@/types/intel";

interface RansomLookEntry {
  post_title?: string;
  group_name?: string;
  description?: string;
  discovered?: string;
  website?: string;
  post_url?: string;
}

export async function fetchRansomLook(limit = 20): Promise<IntelItem[]> {
  try {
    const res = await fetch("https://www.ransomlook.io/api/recent", {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "WorldScope/1.0", Accept: "application/json" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const data: RansomLookEntry[] = await res.json();

    return data.slice(0, limit).map((entry, idx) => {
      const group = entry.group_name || "Unknown Group";
      const title = entry.post_title || "Unnamed Victim";

      return {
        id: `ransomlook-${idx}-${Date.now()}`,
        title: `Ransomware: ${title}`,
        summary: `Group: ${group}. ${(entry.description || "").slice(0, 250)}`,
        url: entry.post_url || entry.website || "https://www.ransomlook.io",
        source: "RansomLook",
        category: "cyber" as const,
        severity: "high" as const,
        publishedAt: entry.discovered
          ? new Date(entry.discovered).toISOString()
          : new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}
