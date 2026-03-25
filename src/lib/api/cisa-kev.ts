/**
 * CISA KEV — Known Exploited Vulnerabilities catalog.
 * Source: https://www.cisa.gov/known-exploited-vulnerabilities-catalog
 * No API key required.
 */

import type { IntelItem } from "@/types/intel";

interface CisaVuln {
  cveID: string;
  vendorProject: string;
  product: string;
  shortDescription: string;
  dateAdded: string;
  knownRansomwareCampaignUse: string;
  notes?: string;
}

export async function fetchCisaKev(limit = 20): Promise<IntelItem[]> {
  try {
    const res = await fetch(
      "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
      { signal: AbortSignal.timeout(10000), next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();

    const vulns: CisaVuln[] = (data.vulnerabilities || []).slice(-limit).reverse();

    return vulns.map((v, idx) => {
      const severity =
        v.knownRansomwareCampaignUse?.toLowerCase() === "known" ? "critical" : "high";

      return {
        id: `cisa-kev-${v.cveID}-${idx}`,
        title: `${v.cveID} — ${v.vendorProject} ${v.product}`,
        summary: v.shortDescription,
        url: `https://nvd.nist.gov/vuln/detail/${v.cveID}`,
        source: "CISA KEV",
        category: "cyber" as const,
        severity,
        publishedAt: v.dateAdded
          ? new Date(v.dateAdded).toISOString()
          : new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}
