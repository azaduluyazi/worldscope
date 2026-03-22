/**
 * Big Mac Index — Economist purchasing power parity data.
 * Free, CC-BY-4.0 license. Static CSV from GitHub.
 * Source: https://github.com/TheEconomist/big-mac-data
 */

export interface BigMacEntry {
  date: string;
  countryCode: string;
  countryName: string;
  localPrice: number;
  dollarPrice: number;
  dollarPpp: number;
  dollarAdj: number;
}

const CSV_URL = "https://raw.githubusercontent.com/TheEconomist/big-mac-data/master/output-data/big-mac-full-index.csv";

export async function fetchBigMacIndex(): Promise<BigMacEntry[]> {
  try {
    const res = await fetch(CSV_URL, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const text = await res.text();

    const lines = text.split("\n").slice(1);
    const latestDate = lines[lines.length - 2]?.split(",")[0] || "";

    return lines
      .filter((line) => line.startsWith(latestDate))
      .map((line) => {
        const cols = line.split(",");
        return {
          date: cols[0],
          countryCode: cols[1],
          countryName: cols[2],
          localPrice: parseFloat(cols[3]) || 0,
          dollarPrice: parseFloat(cols[5]) || 0,
          dollarPpp: parseFloat(cols[6]) || 0,
          dollarAdj: parseFloat(cols[10]) || 0,
        };
      })
      .filter((e) => e.dollarPrice > 0);
  } catch {
    return [];
  }
}
