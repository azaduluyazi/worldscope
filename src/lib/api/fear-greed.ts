/**
 * Alternative.me Fear & Greed Index
 * Free, no API key required.
 * Returns crypto market sentiment (0 = Extreme Fear, 100 = Extreme Greed)
 * Docs: https://alternative.me/crypto/fear-and-greed-index/
 */

export interface FearGreedData {
  value: number;
  classification: string; // "Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"
  timestamp: string;
}

interface FearGreedResponse {
  data: Array<{
    value: string;
    value_classification: string;
    timestamp: string;
  }>;
}

export async function fetchFearGreedIndex(): Promise<FearGreedData | null> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const data: FearGreedResponse = await res.json();
    const item = data.data?.[0];
    if (!item) return null;

    return {
      value: parseInt(item.value, 10),
      classification: item.value_classification,
      timestamp: new Date(parseInt(item.timestamp, 10) * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}
