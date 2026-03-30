import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { seedRead } from "@/lib/seed/seed-utils";

export const runtime = "nodejs";

interface WeatherAlert {
  lat: number;
  lng: number;
  city: string;
  country: string;
  temperature: number;
  windSpeed: number;
  weatherCode: number;
  weatherLabel: string;
  isExtreme: boolean;
}

// Major world cities for weather grid sampling
const WEATHER_CITIES = [
  { city: "London", country: "GB", lat: 51.5, lng: -0.1 },
  { city: "Paris", country: "FR", lat: 48.9, lng: 2.3 },
  { city: "Berlin", country: "DE", lat: 52.5, lng: 13.4 },
  { city: "Moscow", country: "RU", lat: 55.8, lng: 37.6 },
  { city: "Istanbul", country: "TR", lat: 41.0, lng: 29.0 },
  { city: "Dubai", country: "AE", lat: 25.3, lng: 55.3 },
  { city: "Cairo", country: "EG", lat: 30.0, lng: 31.2 },
  { city: "Mumbai", country: "IN", lat: 19.1, lng: 72.9 },
  { city: "Beijing", country: "CN", lat: 39.9, lng: 116.4 },
  { city: "Tokyo", country: "JP", lat: 35.7, lng: 139.7 },
  { city: "Seoul", country: "KR", lat: 37.6, lng: 127.0 },
  { city: "Sydney", country: "AU", lat: -33.9, lng: 151.2 },
  { city: "New York", country: "US", lat: 40.7, lng: -74.0 },
  { city: "Los Angeles", country: "US", lat: 34.1, lng: -118.2 },
  { city: "Chicago", country: "US", lat: 41.9, lng: -87.6 },
  { city: "São Paulo", country: "BR", lat: -23.6, lng: -46.6 },
  { city: "Mexico City", country: "MX", lat: 19.4, lng: -99.1 },
  { city: "Lagos", country: "NG", lat: 6.5, lng: 3.4 },
  { city: "Johannesburg", country: "ZA", lat: -26.2, lng: 28.0 },
  { city: "Nairobi", country: "KE", lat: -1.3, lng: 36.8 },
  { city: "Baghdad", country: "IQ", lat: 33.3, lng: 44.4 },
  { city: "Tehran", country: "IR", lat: 35.7, lng: 51.4 },
  { city: "Riyadh", country: "SA", lat: 24.7, lng: 46.7 },
  { city: "Ankara", country: "TR", lat: 39.9, lng: 32.9 },
  { city: "Bangkok", country: "TH", lat: 13.8, lng: 100.5 },
  { city: "Jakarta", country: "ID", lat: -6.2, lng: 106.8 },
  { city: "Manila", country: "PH", lat: 14.6, lng: 121.0 },
  { city: "Singapore", country: "SG", lat: 1.4, lng: 103.8 },
  { city: "Buenos Aires", country: "AR", lat: -34.6, lng: -58.4 },
  { city: "Lima", country: "PE", lat: -12.0, lng: -77.0 },
];

// WMO weather code → label
function weatherCodeToLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 49) return "Fog";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 84) return "Rain Showers";
  if (code <= 86) return "Snow Showers";
  if (code === 95) return "Thunderstorm";
  if (code <= 99) return "Thunderstorm + Hail";
  return "Unknown";
}

function isExtremeWeather(code: number, temp: number, wind: number): boolean {
  return code >= 95 || temp > 45 || temp < -30 || wind > 80;
}

export async function GET() {
  try {
    // Seed-first: try pre-populated cache
    const seeded = await seedRead<WeatherAlert[]>("seed:natural:weather");
    if (seeded && seeded.length > 0) {
      const extreme = seeded.filter((w) => w.isExtreme);
      return NextResponse.json({ alerts: seeded, extremeCount: extreme.length, total: seeded.length, fromSeed: true });
    }

    const data = await cachedFetch(
      "weather:global",
      async () => {
        const lats = WEATHER_CITIES.map((c) => c.lat).join(",");
        const lngs = WEATHER_CITIES.map((c) => c.lng).join(",");

        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,wind_speed_10m,weather_code&timezone=auto`,
          { signal: AbortSignal.timeout(10000) }
        );
        if (!res.ok) return [];

        const json = await res.json();
        const results: WeatherAlert[] = [];

        // Open-Meteo returns array when multiple coords
        const items = Array.isArray(json) ? json : [json];

        items.forEach((item: Record<string, unknown>, idx: number) => {
          const current = item.current as Record<string, number> | undefined;
          if (!current || idx >= WEATHER_CITIES.length) return;

          const city = WEATHER_CITIES[idx];
          const temp = current.temperature_2m ?? 0;
          const wind = current.wind_speed_10m ?? 0;
          const code = current.weather_code ?? 0;

          results.push({
            lat: city.lat,
            lng: city.lng,
            city: city.city,
            country: city.country,
            temperature: temp,
            windSpeed: wind,
            weatherCode: code,
            weatherLabel: weatherCodeToLabel(code),
            isExtreme: isExtremeWeather(code, temp, wind),
          });
        });

        return results;
      },
      300 // 5 min cache
    );

    return NextResponse.json({
      cities: data,
      total: data.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ cities: [], total: 0, lastUpdated: new Date().toISOString() });
  }
}
