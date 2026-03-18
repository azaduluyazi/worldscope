/**
 * NOAA Aviation Weather Center — METAR and aviation weather data.
 * Free, no API key required.
 * https://aviationweather.gov/data/api/
 */

import type { IntelItem, Severity } from "@/types/intel";

interface MetarData {
  icaoId: string;
  reportTime: string;
  temp: number;
  dewp: number;
  wdir: number | string;
  wspd: number;
  wgst: number | null;
  visib: number | string;
  altim: number;
  fltcat: string; // VFR, MVFR, IFR, LIFR
  rawOb: string;
  name: string;
  lat: number;
  lon: number;
  elev: number;
  clouds?: Array<{ cover: string; base: number }>;
  wxString?: string;
}

// Well-known airport coordinates for enrichment
const AIRPORT_COORDS: Record<string, { lat: number; lng: number; country: string }> = {
  KJFK: { lat: 40.6413, lng: -73.7781, country: "US" },
  EGLL: { lat: 51.4700, lng: -0.4543, country: "GB" },
  LTFM: { lat: 41.2753, lng: 28.7519, country: "TR" },
  OMDB: { lat: 25.2528, lng: 55.3644, country: "AE" },
  LFPG: { lat: 49.0097, lng: 2.5479, country: "FR" },
  EDDF: { lat: 50.0379, lng: 8.5622, country: "DE" },
  RJTT: { lat: 35.5494, lng: 139.7798, country: "JP" },
  VHHH: { lat: 22.3080, lng: 113.9185, country: "HK" },
};

function flightCategoryToSeverity(fltcat: string): Severity {
  switch (fltcat) {
    case "LIFR": return "critical";
    case "IFR": return "high";
    case "MVFR": return "medium";
    case "VFR": return "info";
    default: return "low";
  }
}

/**
 * Fetch METAR aviation weather data from NOAA Aviation Weather Center.
 * Defaults to major international airports.
 */
export async function fetchAviationWeather(
  ids = "KJFK,EGLL,LTFM,OMDB,LFPG,EDDF,RJTT,VHHH"
): Promise<IntelItem[]> {
  try {
    const res = await fetch(
      `https://aviationweather.gov/api/data/metar?ids=${ids}&format=json`,
      {
        signal: AbortSignal.timeout(10000),
        headers: {
          Accept: "application/json",
          "User-Agent": "WorldScope/1.0",
        },
      }
    );
    if (!res.ok) return [];

    const data: MetarData[] = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((metar): IntelItem => {
      const airportInfo = AIRPORT_COORDS[metar.icaoId];
      const wxDesc = metar.wxString ? ` | Wx: ${metar.wxString}` : "";
      const gustInfo = metar.wgst ? ` G${metar.wgst}kt` : "";

      return {
        id: `metar-${metar.icaoId}-${Date.now()}`,
        title: `METAR ${metar.icaoId} (${metar.name || metar.icaoId}): ${metar.fltcat}`,
        summary: `Temp: ${metar.temp}°C | Wind: ${metar.wdir}° @ ${metar.wspd}kt${gustInfo} | Vis: ${metar.visib}sm | Altim: ${metar.altim}hPa${wxDesc}`,
        url: `https://aviationweather.gov/metar?id=${metar.icaoId}`,
        source: "NOAA Aviation Weather",
        category: "aviation",
        severity: flightCategoryToSeverity(metar.fltcat),
        publishedAt: metar.reportTime || new Date().toISOString(),
        lat: metar.lat || airportInfo?.lat,
        lng: metar.lon || airportInfo?.lng,
        countryCode: airportInfo?.country,
      };
    });
  } catch {
    return [];
  }
}
