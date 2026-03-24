import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { intelQuerySchema } from "@/lib/validators/schemas";
import { cachedFetch, TTL, redis } from "@/lib/cache/redis";
import { fetchGdeltArticles, fetchGdeltGeo } from "@/lib/api/gdelt";
import { fetchEarthquakes } from "@/lib/api/usgs";
import { fetchReliefWebDisasters } from "@/lib/api/reliefweb";
import { fetchSpaceflightNews } from "@/lib/api/spaceflight";
import { fetchAllCyberThreats } from "@/lib/api/cyber-threats";
import { fetchFireHotspots } from "@/lib/api/nasa-firms";
import { fetchDiseaseOutbreaks } from "@/lib/api/disease-sh";
import { fetchGDACSAlerts } from "@/lib/api/gdacs";
import { fetchNasaEonet } from "@/lib/api/nasa-eonet";
import { fetchHackerNews } from "@/lib/api/hackernews";
import { fetchWhoOutbreaks } from "@/lib/api/who-outbreaks";
import { fetchSafecastReadings, radiationToIntelItems } from "@/lib/api/radiation";
import { fetchOrefAlerts } from "@/lib/api/tzevaadom";
import { fetchUcdpEvents } from "@/lib/api/ucdp";
import { fetchInternetOutagesAsIntel } from "@/lib/api/cloudflare-radar";
import { fetchKandilliEarthquakes } from "@/lib/api/kandilli";
import { fetchEntsoeIntel } from "@/lib/api/entsoe";
import { fetchEiaIntel } from "@/lib/api/eia";
import { fetchAllSportsScores } from "@/lib/api/espn-sports";
import { fetchSupplyChainAttacks } from "@/lib/api/supply-chain-threats";
import { fetchDollarTomanIntel } from "@/lib/api/dollar-toman";
import { fetchCrisisReports } from "@/lib/api/crisis-news";
import { fetchCoinGeckoNews, fetchCryptoPanicNews } from "@/lib/api/crypto-news";
import { fetchCryptoConvertIntel } from "@/lib/api/crypto-convert";
import { fetchElectricityMapsIntel } from "@/lib/api/electricity-maps";
import { fetchRansomwareVictims } from "@/lib/api/ransomware-live";
import { fetchSarInterference } from "@/lib/api/sar-interference";
import { fetchFootballIntel } from "@/lib/api/football-data";
import { fetchMarketMoversIntel } from "@/lib/api/tv-screener";
import { fetchMajorIndices } from "@/lib/api/finance-mcp";
import { fetchSpaceXLaunches, fetchLaunchLibrary } from "@/lib/api/spacex";
import { fetchNvdCves } from "@/lib/api/nvd-cve";
import { fetchF1Intel } from "@/lib/api/f1-ergast";
import { fetchOpenF1Intel } from "@/lib/api/openf1";
import { fetchNbaIntel } from "@/lib/api/nba-stats";
import { fetchTransfermarktIntel } from "@/lib/api/transfermarkt";
import { fetchCricketIntel } from "@/lib/api/cricket";
import { fetchGoodNews } from "@/lib/api/good-news";
import { gatewayFetch } from "@/lib/api/gateway";
import { persistEvents, fetchPersistedEvents } from "@/lib/db/events";
import type { IntelItem, Category } from "@/types/intel";
import { SEVERITY_ORDER } from "@/types/intel";
import { enrichGeoData } from "@/lib/utils/geo-enrichment";

export const runtime = "nodejs";
export const maxDuration = 120;

// Whitelist of valid categories — prevents cache key injection
const VALID_CATEGORIES = new Set<Category>([
  "conflict", "finance", "cyber", "tech", "natural",
  "aviation", "energy", "diplomacy", "protest", "health", "sports",
]);


export async function GET(request: NextRequest) {
  try {
    const rateLimited = await checkRateLimit(request);
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams);
    const parsed = intelQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { limit, hours: _hours, lang, category: rawCategory, severity: _severity } = parsed.data;
    const category = rawCategory && VALID_CATEGORIES.has(rawCategory as Category)
      ? (rawCategory as Category)
      : null;

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

        const startTime = Date.now();

        // Load disabled sources from Redis (admin toggle)
        const disabledRaw = await redis.get<string[]>("disabled-sources").catch(() => null);
        const disabledSet = new Set<string>(disabledRaw || []);
        // Helper: skip gatewayFetch if source is admin-disabled
        const gf = <T>(sourceId: string, fetcher: () => Promise<T>, opts?: { timeoutMs?: number; fallback?: T }): Promise<T> => {
          if (disabledSet.has(`api:${sourceId}`) || disabledSet.has(sourceId)) {
            return Promise.resolve(opts?.fallback as T ?? [] as unknown as T);
          }
          return gatewayFetch(sourceId, fetcher, opts);
        };

        // 1. DB + Tier 1 critical sources (circuit breaker protected)
        const [dbEvents, ...tier1Results] = await Promise.all([
          fetchPersistedEvents({ category: category || undefined, limit: 1500, hoursBack: 72 }),
          gf("gdelt-articles", () => fetchGdeltArticles(undefined, 50, lang), { fallback: [] }),
          gf("usgs-4.5w", () => fetchEarthquakes("4.5_week"), { fallback: [] }),
          gf("oref", () => fetchOrefAlerts(20), { fallback: [] }),
          gf("gdacs", () => fetchGDACSAlerts(), { fallback: [] }),
        ]);

        // 2. Tier 2 secondary sources (circuit breaker + best-effort)
        const tier2Sources = await Promise.allSettled([
          gf("gdelt-geo", () => fetchGdeltGeo(undefined, 100, lang), { fallback: [] }),
          gf("usgs-2.5d", () => fetchEarthquakes("2.5_day"), { fallback: [] }),
          gf("usgs-sig-month", () => fetchEarthquakes("significant_month"), { fallback: [] }),
          gf("reliefweb", () => fetchReliefWebDisasters(), { fallback: [] }),
          gf("spaceflight", () => fetchSpaceflightNews(), { fallback: [] }),
          gf("disease-sh", () => fetchDiseaseOutbreaks(), { fallback: [] }),
          gf("cyber", () => fetchAllCyberThreats(), { fallback: [] }),
          gf("nasa-firms", () => fetchFireHotspots(50), { fallback: [] }),
          gf("nasa-eonet", () => fetchNasaEonet(14, 30), { fallback: [] }),
          gf("hackernews", () => fetchHackerNews(20), { fallback: [] }),
          gf("who", () => fetchWhoOutbreaks(15), { fallback: [] }),
          gf("safecast", () => fetchSafecastReadings().then(radiationToIntelItems), { fallback: [] }),
          gf("ucdp", () => fetchUcdpEvents(30), { fallback: [] }),
          gf("cloudflare-radar", () => fetchInternetOutagesAsIntel(), { fallback: [] }),
          // ── New sources ──
          gf("kandilli", () => fetchKandilliEarthquakes(), { fallback: [] }),
          gf("entsoe", () => fetchEntsoeIntel(), { fallback: [] }),
          gf("eia", () => fetchEiaIntel(), { fallback: [] }),
          gf("espn-sports", () => fetchAllSportsScores(), { fallback: [] }),
          gf("supply-chain", () => fetchSupplyChainAttacks(), { fallback: [] }),
          gf("dollar-toman", () => fetchDollarTomanIntel(), { fallback: [] }),
          gf("crisis-news", () => fetchCrisisReports(), { fallback: [] }),
          gf("crypto-news", () => fetchCoinGeckoNews(), { fallback: [] }),
          gf("cryptopanic", () => fetchCryptoPanicNews(), { fallback: [] }),
          gf("crypto-convert", () => fetchCryptoConvertIntel(), { fallback: [] }),
          gf("electricity-maps", () => fetchElectricityMapsIntel(), { fallback: [] }),
          gf("ransomware-live", () => fetchRansomwareVictims(), { fallback: [] }),
          gf("sar-interference", () => fetchSarInterference(), { fallback: [] }),
          gf("football-data", () => fetchFootballIntel(), { fallback: [] }),
          gf("tv-screener", () => fetchMarketMoversIntel(), { fallback: [] }),
          gf("market-indices", () => fetchMajorIndices(), { fallback: [] }),
          // ── Session 4: New open sources (no API key needed) ──
          gf("spacex", () => fetchSpaceXLaunches(), { fallback: [] }),
          gf("launch-library", () => fetchLaunchLibrary(), { fallback: [] }),
          gf("nvd-cve", () => fetchNvdCves(15), { fallback: [] }),
          gf("f1", () => fetchF1Intel(), { fallback: [] }),
          gf("openf1", () => fetchOpenF1Intel(), { fallback: [] }),
          gf("nba-stats", () => fetchNbaIntel(), { fallback: [] }),
          gf("transfermarkt", () => fetchTransfermarktIntel(), { fallback: [] }),
          gf("cricket", () => fetchCricketIntel(), { fallback: [] }),
          gf("good-news", () => fetchGoodNews(), { fallback: [] }),
        ]);

        // Merge tier 1 (already resolved) + tier 2 results
        const fastSources: PromiseSettledResult<IntelItem[]>[] = [
          ...tier1Results.map((v): PromiseSettledResult<IntelItem[]> => ({ status: "fulfilled", value: v })),
          ...tier2Sources,
        ];

        // Filter live API results to last 72 hours
        // (USGS significant_month/4.5_week return weeks-old data)
        const MAX_AGE_MS = 72 * 60 * 60 * 1000;
        const cutoff = Date.now() - MAX_AGE_MS;

        const liveItems: IntelItem[] = [];
        for (const result of fastSources) {
          if (result.status === "fulfilled" && Array.isArray(result.value)) {
            for (const item of result.value) {
              if (new Date(item.publishedAt).getTime() >= cutoff) {
                liveItems.push(item);
              }
            }
          }
        }

        // 3. Merge: DB events + live API results
        const allItems = [...dbEvents, ...liveItems];

        // ═══════════════════════════════════════════════════════
        // RSS FALLBACK: If DB has <50 items, fetch priority feeds directly
        // ═══════════════════════════════════════════════════════
        if (dbEvents.length < 50) {
          const { fetchFeed } = await import("@/lib/api/rss-parser");
          const PRIORITY_FEEDS = [
            { url: "https://feeds.bbci.co.uk/news/world/rss.xml", name: "BBC World" },
            { url: "https://rss.cnn.com/rss/edition_world.rss", name: "CNN World" },
            { url: "https://www.aljazeera.com/xml/rss/all.xml", name: "Al Jazeera" },
            { url: "https://www.theguardian.com/world/rss", name: "The Guardian" },
            { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", name: "NYT World" },
            { url: "https://rss.dw.com/xml/rss-en-all", name: "DW News" },
            { url: "https://www.france24.com/en/rss", name: "France24" },
            { url: "https://feeds.npr.org/1004/rss.xml", name: "NPR World" },
            { url: "https://feeds.skynews.com/feeds/rss/world.xml", name: "Sky News" },
            { url: "https://www.aa.com.tr/en/rss/default?cat=world", name: "Anadolu Agency" },
            { url: "https://www.theverge.com/rss/index.xml", name: "The Verge" },
            { url: "https://techcrunch.com/feed/", name: "TechCrunch" },
            { url: "https://feeds.arstechnica.com/arstechnica/index", name: "Ars Technica" },
            { url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", name: "WSJ Markets" },
            { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", name: "CNBC World" },
            { url: "https://www.bleepingcomputer.com/feed/", name: "BleepingComputer" },
            { url: "https://hnrss.org/frontpage", name: "Hacker News" },
            { url: "https://tools.cdc.gov/api/v2/resources/media/rss", name: "CDC Health" },
          ];

          const fallbackResults = await Promise.allSettled(
            PRIORITY_FEEDS.map((f) => fetchFeed(f.url, f.name))
          );
          for (const result of fallbackResults) {
            if (result.status === "fulfilled" && Array.isArray(result.value)) {
              allItems.push(...result.value);
            }
          }
        }

        // Geo-enrich items that lack coordinates
        const enriched = enrichGeoData(allItems);

        // Deduplicate: same URL = always duplicate; similar titles across
        // different sources = duplicate (cross-source dedup)
        const seenUrls = new Set<string>();
        const seenTitles = new Set<string>();
        const unique = enriched.filter((item) => {
          // Exact URL dedup
          if (item.url) {
            const normalizedUrl = item.url.split("?")[0].split("#")[0].toLowerCase();
            if (seenUrls.has(normalizedUrl)) return false;
            seenUrls.add(normalizedUrl);
          }
          // Normalize title: remove common prefixes, lowercase, strip punctuation
          const normalized = item.title
            .toLowerCase()
            .replace(/^(breaking|update|just in|exclusive|watch|opinion|analysis)[:\s-]*/i, "")
            .replace(/[^\w\s]/g, "")
            .replace(/\s+/g, " ")
            .trim();
          // Use first 80 chars of normalized title for similarity
          const titleKey = normalized.slice(0, 80);
          if (seenTitles.has(titleKey)) return false;
          seenTitles.add(titleKey);
          return true;
        });

        // Sort: recency-weighted severity
        // Items older than 24h get deprioritized regardless of severity
        const NOW = Date.now();
        const H24 = 24 * 60 * 60 * 1000;

        unique.sort((a, b) => {
          const aAge = NOW - new Date(a.publishedAt).getTime();
          const bAge = NOW - new Date(b.publishedAt).getTime();
          const aRecent = aAge <= H24;
          const bRecent = bAge <= H24;

          // Recent items always beat old items
          if (aRecent && !bRecent) return -1;
          if (bRecent && !aRecent) return 1;

          // Within same recency bucket: sort by severity then time
          const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
          if (sevDiff !== 0) return sevDiff;
          return bAge === aAge ? 0 : aAge < bAge ? -1 : 1;
        });

        return unique.slice(0, 2000);
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
    if (searchParams.has("hours")) {
      const since = Date.now() - _hours * 60 * 60 * 1000;
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
