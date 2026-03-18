/**
 * Corrently GrünStromIndex — German green energy forecast. No key required.
 * https://corrently.io/
 */

export interface GsiPrediction {
  timeStamp: number;
  gsi: number; // Green energy index 0-100
  residualLoad: number;
  renewableEnergy: number;
  superGruen: boolean;
  eelesignalColor: string; // "green" | "yellow" | "red"
}

export interface GruenstromResponse {
  forecast: GsiPrediction[];
  location: string;
  updatedAt: string;
}

/** Fetch German green energy index prediction from Corrently */
export async function fetchGruenstromIndex(): Promise<GruenstromResponse | null> {
  try {
    const res = await fetch("https://api.corrently.io/v2.0/gsi/prediction", {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.forecast && !Array.isArray(data)) return null;

    const forecast: GsiPrediction[] = (data.forecast || data || []).slice(0, 48);

    return {
      forecast,
      location: data.location || "Germany",
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
