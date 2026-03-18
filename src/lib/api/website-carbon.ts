/**
 * Website Carbon API — Estimate carbon footprint of a website.
 * No API key required for basic lookups.
 * https://api.websitecarbon.com/
 */

export interface WebsiteCarbonResult {
  url: string;
  green: boolean; // hosted on green energy
  bytes: number;
  cleanerThan: number; // percentile 0-1
  statistics: {
    adjustedBytes: number;
    energy: number; // kWh per page view
    co2: {
      grid: { grams: number; litres: number };
      renewable: { grams: number; litres: number };
    };
  };
  updatedAt: string;
}

/**
 * Check the carbon footprint of a URL.
 * Uses the Website Carbon API to estimate energy usage and CO2 per page view.
 */
export async function fetchWebsiteCarbon(
  url: string,
): Promise<WebsiteCarbonResult | null> {
  if (!url) return null;

  try {
    const encoded = encodeURIComponent(url);
    const res = await fetch(
      `https://api.websitecarbon.com/site?url=${encoded}`,
      { signal: AbortSignal.timeout(30000) }, // Carbon check can be slow
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.error) return null;

    return {
      url: data.url || url,
      green: Boolean(data.green),
      bytes: Number(data.bytes || 0),
      cleanerThan: Number(data.cleanerThan || 0),
      statistics: {
        adjustedBytes: Number(data.statistics?.adjustedBytes || 0),
        energy: Number(data.statistics?.energy || 0),
        co2: {
          grid: {
            grams: Number(data.statistics?.co2?.grid?.grams || 0),
            litres: Number(data.statistics?.co2?.grid?.litres || 0),
          },
          renewable: {
            grams: Number(data.statistics?.co2?.renewable?.grams || 0),
            litres: Number(data.statistics?.co2?.renewable?.litres || 0),
          },
        },
      },
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
