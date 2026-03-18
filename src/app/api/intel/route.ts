import { NextResponse } from "next/server";
import { cachedFetch, TTL } from "@/lib/cache/redis";
import { fetchNewsApi } from "@/lib/api/newsapi";
import { fetchGNews } from "@/lib/api/gnews";
import { fetchFeed } from "@/lib/api/rss-parser";
import { fetchGdeltArticles, fetchGdeltGeo } from "@/lib/api/gdelt";
import { fetchEarthquakes } from "@/lib/api/usgs";
import { fetchNasaEonet } from "@/lib/api/nasa-eonet";
import { fetchNvdCves } from "@/lib/api/nvd-cve";
import { fetchWhoOutbreaks } from "@/lib/api/who-outbreaks";
import { fetchReliefWebDisasters } from "@/lib/api/reliefweb";
import { fetchAcledEvents } from "@/lib/api/acled";
import { fetchWeatherAlerts } from "@/lib/api/openweathermap";
import { fetchSpaceflightNews } from "@/lib/api/spaceflight";
import { fetchAviationIncidents } from "@/lib/api/flightradar";
import { fetchNewsData } from "@/lib/api/newsdata";
import { createServerClient } from "@/lib/db/supabase";
import { persistEvents } from "@/lib/db/events";
import type { IntelItem, Category } from "@/types/intel";
import { SEVERITY_ORDER } from "@/types/intel";
import { enrichGeoData } from "@/lib/utils/geo-enrichment";

export const runtime = "nodejs";
export const maxDuration = 60;

// Whitelist of valid categories — prevents cache key injection
const VALID_CATEGORIES = new Set<Category>([
  "conflict", "finance", "cyber", "tech", "natural",
  "aviation", "energy", "diplomacy", "protest", "health",
]);

// Process feeds in batches to avoid overwhelming connections
const BATCH_SIZE = 25;

async function fetchFeedsInBatches(
  feeds: { url: string; name: string }[]
): Promise<IntelItem[]> {
  const allItems: IntelItem[] = [];

  for (let i = 0; i < feeds.length; i += BATCH_SIZE) {
    const batch = feeds.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((f) => fetchFeed(f.url, f.name))
    );
    for (const result of results) {
      if (result.status === "fulfilled") {
        allItems.push(...result.value);
      }
    }
  }

  return allItems;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCategory = searchParams.get("category");
    const category = rawCategory && VALID_CATEGORIES.has(rawCategory as Category)
      ? (rawCategory as Category)
      : null;
    const limit = Math.min(Number(searchParams.get("limit") || 200), 500);

    const cacheKey = category
      ? `intel:feed:${category}`
      : "intel:feed:all";

    const items = await cachedFetch<IntelItem[]>(
      cacheKey,
      async () => {
        // Fetch active feeds from Supabase
        const db = createServerClient();
        let query = db
          .from("feeds")
          .select("url, name, category")
          .eq("is_active", true)
          .lt("error_count", 5);

        if (category) {
          query = query.eq("category", category);
        }

        const { data: feeds } = await query;
        const activeFeeds = feeds || [];

        // Fetch from all sources in parallel
        const [
          newsApi, gNews, rssItems, gdeltDocs, gdeltGeo,
          quakesMajor, quakesRecent, nasaEvents, nvdCves, whoOutbreaks,
          reliefWeb, acledEvents, weatherAlerts, spaceNews, aviationInc, newsData,
        ] = await Promise.allSettled([
            fetchNewsApi(),
            fetchGNews(),
            fetchFeedsInBatches(activeFeeds),
            fetchGdeltArticles(),
            fetchGdeltGeo(undefined, 150),
            fetchEarthquakes("4.5_week"),
            fetchEarthquakes("2.5_day"),
            fetchNasaEonet(30, 60),
            fetchNvdCves(15),
            fetchWhoOutbreaks(10),
            fetchReliefWebDisasters(),
            fetchAcledEvents(),
            fetchWeatherAlerts(),
            fetchSpaceflightNews(),
            fetchAviationIncidents(),
            fetchNewsData(),
          ]);

        const allItems: IntelItem[] = [];

        if (newsApi.status === "fulfilled") allItems.push(...newsApi.value);
        if (gNews.status === "fulfilled") allItems.push(...gNews.value);
        if (rssItems.status === "fulfilled") allItems.push(...rssItems.value);
        if (gdeltDocs.status === "fulfilled") allItems.push(...gdeltDocs.value);
        if (gdeltGeo.status === "fulfilled") allItems.push(...gdeltGeo.value);
        if (quakesMajor.status === "fulfilled") allItems.push(...quakesMajor.value);
        if (quakesRecent.status === "fulfilled") allItems.push(...quakesRecent.value);
        if (nasaEvents.status === "fulfilled") allItems.push(...nasaEvents.value);
        if (nvdCves.status === "fulfilled") allItems.push(...nvdCves.value);
        if (whoOutbreaks.status === "fulfilled") allItems.push(...whoOutbreaks.value);
        if (reliefWeb.status === "fulfilled") allItems.push(...reliefWeb.value);
        if (acledEvents.status === "fulfilled") allItems.push(...acledEvents.value);
        if (weatherAlerts.status === "fulfilled") allItems.push(...weatherAlerts.value);
        if (spaceNews.status === "fulfilled") allItems.push(...spaceNews.value);
        if (aviationInc.status === "fulfilled") allItems.push(...aviationInc.value);
        if (newsData.status === "fulfilled") allItems.push(...newsData.value);

        // Geo-enrich items that lack coordinates
        const enriched = enrichGeoData(allItems);

        // Deduplicate by title similarity
        const seen = new Set<string>();
        const unique = enriched.filter((item) => {
          const key = item.title.toLowerCase().slice(0, 60);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Sort by severity then recency
        unique.sort((a, b) => {
          const sevDiff =
            SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
          if (sevDiff !== 0) return sevDiff;
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
        });

        return unique.slice(0, 500);
      },
      TTL.NEWS
    );

    // Persist to Supabase (fire-and-forget — don't block response)
    persistEvents(items).catch(() => {});

    // Apply limit AFTER cache so different limit params don't cause stale results
    const sliced = items.slice(0, limit);

    return NextResponse.json({
      items: sliced,
      lastUpdated: new Date().toISOString(),
      total: sliced.length,
    });
  } catch {
    return NextResponse.json(
      { items: [], lastUpdated: new Date().toISOString(), total: 0 },
      { status: 500 }
    );
  }
}
