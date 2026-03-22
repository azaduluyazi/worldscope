/**
 * IMF DataMapper API — Global macroeconomic indicators.
 * Free, no API key required.
 * Docs: https://www.imf.org/external/datamapper/api/help
 */

export interface ImfIndicator {
  country: string;
  countryCode: string;
  indicator: string;
  value: number;
  year: number;
}

const IMF_BASE = "https://www.imf.org/external/datamapper/api/v1";

export async function fetchImfGdpGrowth(year?: number): Promise<ImfIndicator[]> {
  const y = year || new Date().getFullYear();
  try {
    const res = await fetch(`${IMF_BASE}/NGDP_RPCH?periods=${y}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();

    const values = data?.values?.NGDP_RPCH || {};
    const items: ImfIndicator[] = [];

    for (const [code, periods] of Object.entries(values)) {
      const val = (periods as Record<string, number>)?.[String(y)];
      if (val != null) {
        items.push({ country: code, countryCode: code, indicator: "GDP Growth (%)", value: val, year: y });
      }
    }
    return items;
  } catch {
    return [];
  }
}

export async function fetchImfInflation(year?: number): Promise<ImfIndicator[]> {
  const y = year || new Date().getFullYear();
  try {
    const res = await fetch(`${IMF_BASE}/PCPIPCH?periods=${y}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();

    const values = data?.values?.PCPIPCH || {};
    const items: ImfIndicator[] = [];

    for (const [code, periods] of Object.entries(values)) {
      const val = (periods as Record<string, number>)?.[String(y)];
      if (val != null) {
        items.push({ country: code, countryCode: code, indicator: "Inflation (%)", value: val, year: y });
      }
    }
    return items;
  } catch {
    return [];
  }
}

export async function fetchImfUnemployment(year?: number): Promise<ImfIndicator[]> {
  const y = year || new Date().getFullYear();
  try {
    const res = await fetch(`${IMF_BASE}/LUR?periods=${y}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();

    const values = data?.values?.LUR || {};
    const items: ImfIndicator[] = [];

    for (const [code, periods] of Object.entries(values)) {
      const val = (periods as Record<string, number>)?.[String(y)];
      if (val != null) {
        items.push({ country: code, countryCode: code, indicator: "Unemployment (%)", value: val, year: y });
      }
    }
    return items;
  } catch {
    return [];
  }
}
