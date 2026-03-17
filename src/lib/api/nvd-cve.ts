import type { IntelItem } from "@/types/intel";

const NVD_API = "https://services.nvd.nist.gov/rest/json/cves/2.0";

interface NvdCve {
  id: string;
  descriptions: Array<{ lang: string; value: string }>;
  published: string;
  metrics?: {
    cvssMetricV31?: Array<{
      cvssData: { baseScore: number; baseSeverity: string };
    }>;
  };
  references?: Array<{ url: string }>;
}

/**
 * Fetch recent CVEs from NIST NVD API.
 * Returns high-severity vulnerabilities from the last 7 days.
 */
export async function fetchNvdCves(limit = 20): Promise<IntelItem[]> {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const pubStartDate = since.toISOString().replace("Z", "+00:00");
    const pubEndDate = new Date().toISOString().replace("Z", "+00:00");

    const url = `${NVD_API}?pubStartDate=${encodeURIComponent(pubStartDate)}&pubEndDate=${encodeURIComponent(pubEndDate)}&cvssV3Severity=HIGH&resultsPerPage=${limit}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "WorldScope/1.0" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];
    const data = await res.json();

    const cves: NvdCve[] = (data.vulnerabilities || []).map(
      (v: { cve: NvdCve }) => v.cve
    );

    return cves.map((cve) => {
      const desc =
        cve.descriptions.find((d) => d.lang === "en")?.value || cve.id;
      const score =
        cve.metrics?.cvssMetricV31?.[0]?.cvssData.baseScore ?? 0;
      const severity =
        score >= 9 ? "critical" : score >= 7 ? "high" : "medium";

      return {
        id: `nvd-${cve.id}`,
        title: `${cve.id}: ${desc.slice(0, 120)}`,
        summary: desc,
        url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
        source: "NIST NVD",
        category: "cyber" as const,
        severity,
        publishedAt: cve.published,
      };
    });
  } catch {
    return [];
  }
}
