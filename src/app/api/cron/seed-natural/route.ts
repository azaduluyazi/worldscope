import { NextResponse } from "next/server";
import { runSeeder, seedPublish } from "@/lib/seed/seed-utils";
import { TTL } from "@/lib/cache/redis";
import { fetchEarthquakes } from "@/lib/api/usgs";
import { fetchFireHotspots } from "@/lib/api/nasa-firms";
import { SEED_KEYS } from "@/lib/cache/keys";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runSeeder("seed-natural", 30_000, async () => {
    const results: Record<string, number> = {};

    // Earthquakes
    try {
      const quakes = await fetchEarthquakes();
      await seedPublish(SEED_KEYS.natural.earthquakes, quakes, TTL.MEDIUM, "seed-natural");
      results.earthquakes = quakes.length;
    } catch (err) {
      console.error("[cron/seed-natural]", err);
      results.earthquakes = 0;
    }

    // Weather — inline fetch from Open-Meteo (same as weather route)
    try {
      const cities = [
        { lat: 51.5, lng: -0.1 }, { lat: 48.9, lng: 2.3 },
        { lat: 40.7, lng: -74.0 }, { lat: 35.7, lng: 139.7 },
        { lat: 39.9, lng: 116.4 }, { lat: 41.0, lng: 29.0 },
        { lat: 55.8, lng: 37.6 }, { lat: 19.1, lng: 72.9 },
        { lat: -33.9, lng: 151.2 }, { lat: -23.6, lng: -46.6 },
      ];
      const lats = cities.map((c) => c.lat).join(",");
      const lngs = cities.map((c) => c.lng).join(",");
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,wind_speed_10m,weather_code&timezone=auto`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        const weatherData = await res.json();
        const items = Array.isArray(weatherData) ? weatherData : [weatherData];
        await seedPublish(SEED_KEYS.natural.weather, items, TTL.MEDIUM, "seed-natural");
        results.weather = items.length;
      } else {
        results.weather = 0;
      }
    } catch (err) {
      console.error("[cron/seed-natural]", err);
      results.weather = 0;
    }

    // Fire hotspots (NASA FIRMS)
    try {
      const fires = await fetchFireHotspots();
      await seedPublish(SEED_KEYS.natural.fires, fires, TTL.MEDIUM, "seed-natural");
      results.fires = fires.length;
    } catch (err) {
      console.error("[cron/seed-natural]", err);
      results.fires = 0;
    }

    return results;
  });

  return NextResponse.json(result);
}
