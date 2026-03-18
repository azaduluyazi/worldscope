/**
 * VulDB — Vulnerability database
 * https://vuldb.com/?doc.api
 */
import type { IntelItem } from "@/types/intel";

export async function fetchVulDBRecent(): Promise<IntelItem[]> {
  const apiKey = process.env.VULDB_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch("https://vuldb.com/?api", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `apikey=${apiKey}&recent=10`,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.result || []).slice(0, 10).map((v: Record<string, unknown>, i: number): IntelItem => {
      const entry = (v.entry || {}) as Record<string, string>;
      const cvss = (v.cvss || {}) as Record<string, string>;
      const vuln = (v.vulnerability || {}) as Record<string, string>;
      const score = Number(cvss.score || 0);
      return {
        id: `vuldb-${entry.id || i}-${Date.now()}`,
        title: String(entry.title || "Vulnerability"),
        summary: `CVSS: ${cvss.score || "?"} | Risk: ${vuln.risk || "?"}`,
        url: `https://vuldb.com/?id.${entry.id || ""}`,
        source: "VulDB",
        category: "cyber",
        severity: score >= 9 ? "critical" : score >= 7 ? "high" : "medium",
        publishedAt: new Date().toISOString(),
      };
    });
  } catch { return []; }
}
