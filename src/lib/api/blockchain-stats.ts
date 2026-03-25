/**
 * Blockchain.info — Bitcoin Network Statistics.
 * Source: https://api.blockchain.info/stats
 * No API key required.
 */

import type { IntelItem } from "@/types/intel";

interface BlockchainStats {
  market_price_usd: number;
  hash_rate: number;
  n_tx: number;
  blocks_size: number;
  total_btc_sent: number;
  estimated_btc_sent: number;
  minutes_between_blocks: number;
}

export async function fetchBlockchainStats(): Promise<IntelItem[]> {
  try {
    const res = await fetch("https://api.blockchain.info/stats", {
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data: BlockchainStats = await res.json();

    const price = data.market_price_usd?.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }) ?? "N/A";

    const hashrate = data.hash_rate
      ? (data.hash_rate / 1e18).toFixed(2) + " EH/s"
      : "N/A";

    return [
      {
        id: `blockchain-stats-${Date.now()}`,
        title: `Bitcoin: ${price}`,
        summary: `Hashrate: ${hashrate} | Transactions (24h): ${data.n_tx?.toLocaleString() ?? "N/A"} | Block interval: ${data.minutes_between_blocks?.toFixed(1) ?? "N/A"} min`,
        url: "https://www.blockchain.com/explorer",
        source: "Blockchain.info",
        category: "finance" as const,
        severity: "info" as const,
        publishedAt: new Date().toISOString(),
      },
    ];
  } catch {
    return [];
  }
}
