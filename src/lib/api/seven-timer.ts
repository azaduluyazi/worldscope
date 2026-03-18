/**
 * 7Timer! — Astronomical weather forecasting API. No key required.
 * http://www.7timer.info/doc.php?lang=en
 */

export interface AstroForecast {
  timepoint: number; // hours from init time
  cloudcover: number; // 1-9 scale
  seeing: number; // 1-8 scale
  transparency: number; // 1-8 scale
  liftedIndex: number;
  rh2m: number; // relative humidity category
  wind10m: { direction: string; speed: number };
  temp2m: number;
  precType: string; // "none" | "rain" | "snow" | "frzr" | "icep"
}

export interface SevenTimerResponse {
  product: string;
  init: string; // YYYYMMDDHH
  dataseries: AstroForecast[];
}

/**
 * Fetch astronomical weather forecast from 7Timer.
 * Defaults to lon=0, lat=0. Pass coordinates for a specific location.
 */
export async function fetchAstroWeather(
  lon = 0,
  lat = 0,
): Promise<SevenTimerResponse | null> {
  try {
    const params = new URLSearchParams({
      lon: String(lon),
      lat: String(lat),
      product: "astro",
      output: "json",
    });
    const res = await fetch(`https://www.7timer.info/bin/api.pl?${params}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.dataseries) return null;

    return {
      product: data.product || "astro",
      init: data.init || "",
      dataseries: (data.dataseries as AstroForecast[]).slice(0, 24),
    };
  } catch {
    return null;
  }
}
