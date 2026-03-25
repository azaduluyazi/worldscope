/**
 * Supply Chain / Exploit Data — CISA Known Exploited Vulnerabilities catalog.
 * Free, no API key required. Updated regularly by CISA.
 * Replaces: IQTLabs/tstromberg repos (both 404).
 */

import type { IntelItem, Severity } from "@/types/intel";

const CISA_KEV_URL =
  "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";

interface KevVuln {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownRansomwareCampaignUse: string;
}

function kevToSeverity(v: KevVuln): Severity {
  if (v.knownRansomwareCampaignUse === "Known") return "critical";
  const desc = v.shortDescription.toLowerCase();
  if (desc.includes("remote code execution") || desc.includes("rce")) return "critical";
  if (desc.includes("privilege escalation") || desc.includes("authentication bypass")) return "high";
  return "medium";
}

/**
 * Fetch latest CISA KEV entries (most recent additions).
 */
export async function fetchSupplyChainAttacks(): Promise<IntelItem[]> {
  try {
    const res = await fetch(CISA_KEV_URL, {
      signal: AbortSignal.timeout(12000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const vulns: KevVuln[] = data?.vulnerabilities || [];
    if (!Array.isArray(vulns)) return [];

    // Most recently added first
    return vulns
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
      .slice(0, 20)
      .map((v): IntelItem => ({
        id: `kev-${v.cveID}`,
        title: `🛡️ ${v.cveID}: ${v.vendorProject} ${v.product}`,
        summary: `${v.vulnerabilityName} | ${v.shortDescription.slice(0, 250)}${v.knownRansomwareCampaignUse === "Known" ? " | ⚠️ Used in ransomware" : ""}`,
        url: `https://nvd.nist.gov/vuln/detail/${v.cveID}`,
        source: "CISA KEV",
        category: "cyber",
        severity: kevToSeverity(v),
        publishedAt: new Date(v.dateAdded).toISOString(),
      }));
  } catch {
    return [];
  }
}
