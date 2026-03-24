/**
 * Transfermarkt — Football transfer news and market values.
 * Free, no API key. Uses transfermarkt-api.fly.dev (unofficial REST proxy).
 * Source: dcaribou/transfermarkt-datasets (350 stars)
 * Gap: No transfer news/market data in current SportsScope.
 */

import type { IntelItem } from "@/types/intel";

const TM_API = "https://transfermarkt-api.fly.dev";

interface Transfer {
  id: string;
  playerName: string;
  fromClub: string;
  toClub: string;
  fee?: string;
  marketValue?: string;
  date?: string;
}

/**
 * Fetch latest major transfers.
 */
export async function fetchLatestTransfers(): Promise<IntelItem[]> {
  try {
    // Top 5 leagues latest transfers
    const res = await fetch(`${TM_API}/transfers`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const transfers: Transfer[] = Array.isArray(data?.transfers)
      ? data.transfers.slice(0, 10)
      : [];

    return transfers.map((t): IntelItem => ({
      id: `tm-transfer-${t.id || Date.now()}`,
      title: `🔄 ${t.playerName}: ${t.fromClub} → ${t.toClub}${t.fee ? ` (${t.fee})` : ""}`,
      summary: `Transfer: ${t.playerName} moves from ${t.fromClub} to ${t.toClub}${t.fee ? ` for ${t.fee}` : ""}${t.marketValue ? ` | Market value: ${t.marketValue}` : ""}`,
      url: "https://www.transfermarkt.com",
      source: "Transfermarkt",
      category: "sports",
      severity: "info",
      publishedAt: t.date || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch most valuable players / market value updates.
 */
export async function fetchMarketValues(): Promise<IntelItem[]> {
  try {
    const res = await fetch(`${TM_API}/market-values`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const players = Array.isArray(data?.players) ? data.players.slice(0, 5) : [];
    if (players.length === 0) return [];

    const list = players.map(
      (p: { name: string; marketValue: string; club: string }, i: number) =>
        `${i + 1}. ${p.name} (${p.club}) — ${p.marketValue}`
    ).join(" | ");

    return [{
      id: `tm-values-${Date.now()}`,
      title: `💰 Most Valuable Players: ${players[0]?.name || "TBD"}`,
      summary: list,
      url: "https://www.transfermarkt.com/spieler-statistik/wertvollstespieler/marktwertetop",
      source: "Transfermarkt",
      category: "sports",
      severity: "info",
      publishedAt: new Date().toISOString(),
    }];
  } catch {
    return [];
  }
}

/**
 * Combined Transfermarkt intel.
 */
export async function fetchTransfermarktIntel(): Promise<IntelItem[]> {
  const [transfers, values] = await Promise.allSettled([
    fetchLatestTransfers(),
    fetchMarketValues(),
  ]);

  return [
    ...(transfers.status === "fulfilled" ? transfers.value : []),
    ...(values.status === "fulfilled" ? values.value : []),
  ];
}
