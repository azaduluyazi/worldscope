/**
 * Microsoft Security Response Center (MSRC) — Security advisories.
 * Free, no API key required.
 * https://api.msrc.microsoft.com/cvrf/v3.0
 */

import type { IntelItem, Severity } from "@/types/intel";

interface MsrcUpdate {
  ID: string;
  Alias: string;
  DocumentTitle: string;
  Severity: string;
  InitialReleaseDate: string;
  CurrentReleaseDate: string;
  CvrfUrl: string;
}

interface MsrcResponse {
  "@odata.context": string;
  value: MsrcUpdate[];
}

function mapMsrcSeverity(severity: string): Severity {
  const s = severity?.toLowerCase() || "";
  if (s.includes("critical")) return "critical";
  if (s.includes("important") || s.includes("high")) return "high";
  if (s.includes("moderate") || s.includes("medium")) return "medium";
  if (s.includes("low")) return "low";
  return "info";
}

/**
 * Fetch recent Microsoft Security advisories from MSRC.
 * Returns security updates and patches as IntelItems.
 */
export async function fetchMsrcAdvisories(limit = 20): Promise<IntelItem[]> {
  try {
    const res = await fetch("https://api.msrc.microsoft.com/cvrf/v3.0/updates", {
      signal: AbortSignal.timeout(10000),
      headers: {
        Accept: "application/json",
        "User-Agent": "WorldScope/1.0",
      },
    });
    if (!res.ok) return [];

    const data: MsrcResponse = await res.json();
    if (!data.value || !Array.isArray(data.value)) return [];

    return data.value
      .slice(0, limit)
      .map((update): IntelItem => ({
        id: `msrc-${update.ID}`,
        title: `MSRC ${update.ID}: ${update.DocumentTitle || update.Alias}`,
        summary: `Alias: ${update.Alias} | Severity: ${update.Severity || "N/A"} | Released: ${update.CurrentReleaseDate}`,
        url: update.CvrfUrl || `https://msrc.microsoft.com/update-guide/vulnerability/${update.ID}`,
        source: "Microsoft MSRC",
        category: "cyber",
        severity: mapMsrcSeverity(update.Severity),
        publishedAt: update.InitialReleaseDate || new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}
