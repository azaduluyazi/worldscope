/**
 * Mempool.space — Bitcoin Mempool Fees & Hashrate.
 * Source: https://mempool.space/api
 * No API key required.
 */

import type { IntelItem } from "@/types/intel";

interface MempoolFees {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

interface MempoolHashrate {
  currentHashrate: number;
  currentDifficulty: number;
}

export async function fetchMempoolBtc(): Promise<IntelItem[]> {
  try {
    const [feesRes, hashrateRes] = await Promise.all([
      fetch("https://mempool.space/api/v1/fees/recommended", {
        signal: AbortSignal.timeout(10000),
        next: { revalidate: 120 },
      }),
      fetch("https://mempool.space/api/v1/mining/hashrate/1w", {
        signal: AbortSignal.timeout(10000),
        next: { revalidate: 3600 },
      }),
    ]);

    if (!feesRes.ok) return [];
    const fees: MempoolFees = await feesRes.json();

    let hashrateInfo = "";
    if (hashrateRes.ok) {
      const hashData: MempoolHashrate = await hashrateRes.json();
      const hr = hashData.currentHashrate;
      const eh = hr ? (hr / 1e18).toFixed(2) : "N/A";
      hashrateInfo = ` | Hashrate: ${eh} EH/s`;
    }

    return [
      {
        id: `mempool-fees-${Date.now()}`,
        title: `BTC Fee: ${fees.fastestFee} sat/vB (fastest)`,
        summary: `Fastest: ${fees.fastestFee} | 30min: ${fees.halfHourFee} | 1hr: ${fees.hourFee} | Economy: ${fees.economyFee} sat/vB${hashrateInfo}`,
        url: "https://mempool.space",
        source: "Mempool.space",
        category: "finance" as const,
        severity: "info" as const,
        publishedAt: new Date().toISOString(),
      },
    ];
  } catch {
    return [];
  }
}
