/**
 * Storm Glass — Marine weather for strategic waterways
 * https://stormglass.io/
 */

export interface MarineWeather {
  location: string;
  lat: number;
  lng: number;
  waveHeight: number;
  windSpeed: number;
  waterTemperature: number;
  visibility: number;
  timestamp: string;
}

// Strategic waterway monitoring points
const WATERWAYS = [
  { name: "Strait of Hormuz", lat: 26.5, lng: 56.3 },
  { name: "Suez Canal", lat: 30.4, lng: 32.3 },
  { name: "Strait of Malacca", lat: 2.5, lng: 101.5 },
  { name: "English Channel", lat: 50.8, lng: 1.2 },
  { name: "Bab el-Mandeb", lat: 12.6, lng: 43.3 },
];

/** Fetch marine weather for strategic waterways */
export async function fetchMarineWeather(): Promise<MarineWeather[]> {
  const apiKey = process.env.STORMGLASS_API_KEY;
  if (!apiKey) return [];

  const results: MarineWeather[] = [];

  for (const wp of WATERWAYS) {
    try {
      const res = await fetch(
        `https://api.stormglass.io/v2/weather/point?lat=${wp.lat}&lng=${wp.lng}&params=waveHeight,windSpeed,waterTemperature,visibility`,
        {
          signal: AbortSignal.timeout(8000),
          headers: { Authorization: apiKey },
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const hour = data?.hours?.[0];
      if (!hour) continue;

      results.push({
        location: wp.name,
        lat: wp.lat,
        lng: wp.lng,
        waveHeight: hour.waveHeight?.sg || 0,
        windSpeed: hour.windSpeed?.sg || 0,
        waterTemperature: hour.waterTemperature?.sg || 0,
        visibility: hour.visibility?.sg || 0,
        timestamp: hour.time || new Date().toISOString(),
      });
    } catch { continue; }
  }

  return results;
}
