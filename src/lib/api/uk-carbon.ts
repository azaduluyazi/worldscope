/**
 * UK Carbon Intensity API — electricity grid carbon intensity. No key required.
 * https://api.carbonintensity.org.uk/
 */

export interface CarbonIntensity {
  from: string;
  to: string;
  forecast: number;
  actual: number | null;
  index: string; // "very low" | "low" | "moderate" | "high" | "very high"
  generationMix: Array<{ fuel: string; perc: number }>;
}

/** Fetch current UK carbon intensity */
export async function fetchUKCarbonIntensity(): Promise<CarbonIntensity | null> {
  try {
    const res = await fetch("https://api.carbonintensity.org.uk/intensity", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data?.data?.[0];
    if (!entry) return null;

    // Also fetch generation mix
    const mixRes = await fetch("https://api.carbonintensity.org.uk/generation", {
      signal: AbortSignal.timeout(5000),
    });
    const mixData = mixRes.ok ? await mixRes.json() : null;

    return {
      from: entry.from,
      to: entry.to,
      forecast: entry.intensity?.forecast || 0,
      actual: entry.intensity?.actual || null,
      index: entry.intensity?.index || "moderate",
      generationMix: mixData?.data?.generationmix || [],
    };
  } catch {
    return null;
  }
}
