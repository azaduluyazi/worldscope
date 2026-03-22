/**
 * BIS (Bank for International Settlements) SDMX API.
 * Free, no API key required. Attribution required.
 * Docs: https://data.bis.org
 */

export interface BisPolicyRate {
  country: string;
  countryCode: string;
  rate: number;
  date: string;
}

const BIS_BASE = "https://stats.bis.org/api/v2";

export async function fetchBisPolicyRates(): Promise<BisPolicyRate[]> {
  try {
    const res = await fetch(
      `${BIS_BASE}/data/WS_CBPOL_D/all?detail=dataonly&lastNObservations=1&format=jsondata`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) return [];
    const data = await res.json();

    const series = data?.dataSets?.[0]?.series || {};
    const dimensions = data?.structure?.dimensions?.series || [];
    const refAreaDim = dimensions.find((d: Record<string, unknown>) => d.id === "REF_AREA");
    const refAreaValues: Array<{ id: string; name: string }> = refAreaDim?.values || [];

    const rates: BisPolicyRate[] = [];
    for (const [key, seriesData] of Object.entries(series)) {
      const dimIndices = key.split(":");
      const refAreaIdx = parseInt(dimIndices[0]);
      const refArea = refAreaValues[refAreaIdx];

      const obs = (seriesData as Record<string, unknown>)?.observations as Record<string, number[]> || {};
      const lastObs = Object.entries(obs).pop();
      if (lastObs) {
        const [, values] = lastObs;
        rates.push({
          country: refArea?.name || "",
          countryCode: refArea?.id || "",
          rate: values[0],
          date: new Date().toISOString(),
        });
      }
    }
    return rates;
  } catch {
    return [];
  }
}
