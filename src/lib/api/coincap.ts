/**
 * CoinCap — Real-time cryptocurrency market data.
 * Free, no API key required.
 * https://docs.coincap.io/
 */

export interface CoinCapAsset {
  id: string;
  rank: string;
  symbol: string;
  name: string;
  supply: string;
  maxSupply: string | null;
  marketCapUsd: string;
  volumeUsd24Hr: string;
  priceUsd: string;
  changePercent24Hr: string;
  vwap24Hr: string;
  explorer: string | null;
}

interface CoinCapResponse {
  data: CoinCapAsset[];
  timestamp: number;
}

/**
 * Fetch top cryptocurrency assets from CoinCap.
 * Returns ranked list of crypto assets with market data.
 */
export async function fetchCoinCapAssets(limit = 20): Promise<CoinCapAsset[]> {
  try {
    const res = await fetch(
      `https://api.coincap.io/v2/assets?limit=${limit}`,
      {
        signal: AbortSignal.timeout(8000),
        headers: {
          Accept: "application/json",
          "User-Agent": "WorldScope/1.0",
        },
      }
    );
    if (!res.ok) return [];

    const data: CoinCapResponse = await res.json();
    if (!Array.isArray(data.data)) return [];

    return data.data;
  } catch {
    return [];
  }
}

/**
 * Fetch a single asset by ID from CoinCap.
 */
export async function fetchCoinCapAsset(id: string): Promise<CoinCapAsset | null> {
  try {
    const res = await fetch(`https://api.coincap.io/v2/assets/${id}`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const data: { data: CoinCapAsset; timestamp: number } = await res.json();
    return data.data || null;
  } catch {
    return null;
  }
}

/**
 * Fetch 24h price history for an asset.
 */
export interface CoinCapHistory {
  priceUsd: string;
  time: number;
  date: string;
}

export async function fetchCoinCapHistory(
  id: string,
  interval: "m1" | "m5" | "m15" | "m30" | "h1" | "h2" | "h6" | "h12" | "d1" = "h1"
): Promise<CoinCapHistory[]> {
  try {
    const end = Date.now();
    const start = end - 24 * 60 * 60 * 1000;

    const res = await fetch(
      `https://api.coincap.io/v2/assets/${id}/history?interval=${interval}&start=${start}&end=${end}`,
      {
        signal: AbortSignal.timeout(8000),
        headers: { Accept: "application/json" },
      }
    );
    if (!res.ok) return [];

    const data: { data: CoinCapHistory[] } = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}
