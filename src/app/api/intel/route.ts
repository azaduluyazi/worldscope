import { NextResponse } from "next/server";
import { cachedFetch, TTL } from "@/lib/cache/redis";
import { fetchGdeltArticles, fetchGdeltGeo } from "@/lib/api/gdelt";
import { fetchEarthquakes } from "@/lib/api/usgs";
import { fetchReliefWebDisasters } from "@/lib/api/reliefweb";
import { fetchSpaceflightNews } from "@/lib/api/spaceflight";
import { fetchAllCyberThreats } from "@/lib/api/cyber-threats";
import { fetchFireHotspots } from "@/lib/api/nasa-firms";
import { fetchDiseaseOutbreaks } from "@/lib/api/disease-sh";
import { fetchGDACSAlerts } from "@/lib/api/gdacs";
import { persistEvents, fetchPersistedEvents } from "@/lib/db/events";
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


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCategory = searchParams.get("category");
    const category = rawCategory && VALID_CATEGORIES.has(rawCategory as Category)
      ? (rawCategory as Category)
      : null;
    const limit = Math.min(Number(searchParams.get("limit") || 200), 500);
    const lang = searchParams.get("lang") || "en";

    const cacheKey = category
      ? `intel:feed:${category}:${lang}`
      : `intel:feed:all:${lang}`;

    const items = await cachedFetch<IntelItem[]>(
      cacheKey,
      async () => {
        // ═══════════════════════════════════════════════════════
        // STRATEGY: DB-first + fast APIs only
        // RSS feeds are fetched by /api/cron/fetch-feeds (background)
        // This endpoint reads persisted events + fast real-time APIs
        // ═══════════════════════════════════════════════════════

        // 1. Read persisted events from Supabase (< 1 second)
        const dbEvents = await fetchPersistedEvents({
          category: category || undefined,
          limit: 300,
          hoursBack: 48,
        });

        // 2. Fetch ONLY fast, lightweight APIs (no RSS, < 10s total)
        const fastSources = await Promise.allSettled([
          fetchGdeltArticles(undefined, 20, lang),
          fetchGdeltGeo(undefined, 50, lang),
          fetchEarthquakes("4.5_week"),
          fetchEarthquakes("2.5_day"),
          fetchReliefWebDisasters(),
          fetchGDACSAlerts(),
          fetchSpaceflightNews(),
          fetchDiseaseOutbreaks(),
          fetchAllCyberThreats(),
          fetchFireHotspots(20),
        ]);

        const liveItems: IntelItem[] = [];
        for (const result of fastSources) {
          if (result.status === "fulfilled" && Array.isArray(result.value)) {
            liveItems.push(...result.value);
          }
        }

        // 3. Merge: DB events + live API results
        const allItems = [...dbEvents, ...liveItems];

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

        // Sort: critical always first, then severity, then recency
        unique.sort((a, b) => {
          // Critical events always on top
          if (a.severity === "critical" && b.severity !== "critical") return -1;
          if (b.severity === "critical" && a.severity !== "critical") return 1;
          const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
          if (sevDiff !== 0) return sevDiff;
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        });

        return unique.slice(0, 500);
      },
      TTL.NEWS
    );

    // Persist live items to Supabase (fire-and-forget)
    persistEvents(items).catch(() => {});

    // Country filter (optional query param — applied after cache)
    const countryParam = searchParams.get("country");
    let filtered = items;
    if (countryParam) {
      filtered = filtered.filter(
        (i) => i.countryCode?.toUpperCase() === countryParam.toUpperCase()
      );
    }

    // Text search filter (optional — matches title or summary)
    const query = searchParams.get("q");
    if (query && query.trim().length >= 2) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.summary && i.summary.toLowerCase().includes(q)) ||
          i.source.toLowerCase().includes(q)
      );
    }

    // Source filter (optional)
    const sourceParam = searchParams.get("source");
    if (sourceParam) {
      filtered = filtered.filter(
        (i) => i.source.toLowerCase() === sourceParam.toLowerCase()
      );
    }

    // Hours filter (optional — filter by publishedAt age)
    const hoursParam = searchParams.get("hours");
    if (hoursParam) {
      const hours = Math.min(Math.max(Number(hoursParam) || 24, 1), 720);
      const since = Date.now() - hours * 60 * 60 * 1000;
      filtered = filtered.filter(
        (i) => new Date(i.publishedAt).getTime() >= since
      );
    }

    // Apply limit AFTER cache so different limit params don't cause stale results
    const sliced = filtered.slice(0, limit);

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
