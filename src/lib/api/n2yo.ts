/**
 * N2YO — Satellite tracking (NORAD TLE)
 * https://www.n2yo.com/api/
 */

export interface SatellitePosition {
  satid: number;
  satname: string;
  satlatitude: number;
  satlongitude: number;
  sataltitude: number;
  timestamp: number;
}

/** Fetch ISS + notable satellite positions */
export async function fetchSatellitePositions(): Promise<SatellitePosition[]> {
  const apiKey = process.env.N2YO_API_KEY;
  if (!apiKey) return [];
  try {
    // ISS NORAD ID = 25544
    const res = await fetch(
      `https://api.n2yo.com/rest/v1/satellite/positions/25544/0/0/0/1&apiKey=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.positions || []).map((p: Record<string, number>): SatellitePosition => ({
      satid: data.info?.satid || 25544,
      satname: data.info?.satname || "ISS",
      satlatitude: p.satlatitude,
      satlongitude: p.satlongitude,
      sataltitude: p.sataltitude,
      timestamp: p.timestamp,
    }));
  } catch { return []; }
}
