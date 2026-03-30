/**
 * CorridorRisk — Maritime Shipping Corridor Risk Intelligence
 * Requires API key via CORRIDOR_RISK_API_KEY.
 * https://api.corridorrisk.io/
 */

import { gatewayFetch } from "@/lib/api/gateway";

export interface CorridorRisk {
  corridor: string;      // e.g. "Strait of Hormuz"
  riskLevel: string;     // "low", "medium", "high", "critical"
  riskScore: number;     // 0-100
  threats: string[];
  lastUpdated: string;
}

const CORRIDOR_BASE = "https://api.corridorrisk.io/v1/corridors";

/** Fetch maritime corridor risk assessments */
export async function fetchCorridorRisks(): Promise<CorridorRisk[]> {
  const apiKey = process.env.CORRIDOR_RISK_API_KEY;
  if (!apiKey) return [];

  return gatewayFetch(
    "corridorrisk",
    async () => {
      const res = await fetch(CORRIDOR_BASE, {
        headers: {
          "X-Api-Key": apiKey,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return [];

      const json = await res.json();
      const items: Array<Record<string, unknown>> = json?.data || json?.corridors || json || [];
      if (!Array.isArray(items)) return [];

      return items.map((item) => ({
        corridor: (item.corridor as string) || (item.name as string) || "",
        riskLevel: (item.riskLevel as string) || (item.risk_level as string) || "low",
        riskScore: Number(item.riskScore || item.risk_score || 0),
        threats: Array.isArray(item.threats)
          ? (item.threats as string[])
          : [],
        lastUpdated: (item.lastUpdated as string) || (item.last_updated as string) || "",
      }));
    },
    { timeoutMs: 15000, fallback: [] }
  );
}
