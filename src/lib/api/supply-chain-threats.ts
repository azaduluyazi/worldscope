/**
 * Supply Chain Attack Data — Known software supply chain attacks.
 * Based on tstromberg/supplychain-attack-data repository.
 * Free, no API key required.
 */

import type { IntelItem, Severity } from "@/types/intel";

const SUPPLY_CHAIN_RAW =
  "https://raw.githubusercontent.com/tstromberg/supplychain-attack-data/main/data/attacks.json";

interface SupplyChainAttack {
  name: string;
  date: string;
  description: string;
  type: string;
  target: string;
  references: string[];
  impact?: string;
}

function attackToSeverity(attack: SupplyChainAttack): Severity {
  const desc = (attack.description + " " + (attack.impact || "")).toLowerCase();
  if (desc.includes("critical") || desc.includes("nation-state") || desc.includes("millions")) return "critical";
  if (desc.includes("widespread") || desc.includes("major") || desc.includes("thousands")) return "high";
  if (desc.includes("moderate") || desc.includes("hundreds")) return "medium";
  return "low";
}

/**
 * Fetch known supply chain attacks catalog.
 */
export async function fetchSupplyChainAttacks(): Promise<IntelItem[]> {
  try {
    const res = await fetch(SUPPLY_CHAIN_RAW, {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data: SupplyChainAttack[] = await res.json();
    if (!Array.isArray(data)) return [];

    // Return most recent attacks first
    return data
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 25)
      .map((a): IntelItem => ({
        id: `supply-chain-${a.name.replace(/\s+/g, "-").toLowerCase()}`,
        title: `Supply Chain: ${a.name}`,
        summary: `${a.description.slice(0, 280)}${a.type ? ` | Type: ${a.type}` : ""}${a.target ? ` | Target: ${a.target}` : ""}`,
        url: a.references?.[0] || "https://github.com/tstromberg/supplychain-attack-data",
        source: "Supply Chain DB",
        category: "cyber",
        severity: attackToSeverity(a),
        publishedAt: new Date(a.date).toISOString() || new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}
