import { NextResponse } from "next/server";
import { persistEvents } from "@/lib/db/events";
import { fetchGdeltArticles, fetchGdeltGeo } from "@/lib/api/gdelt";
import { fetchEarthquakes } from "@/lib/api/usgs";
import { fetchNasaEonet } from "@/lib/api/nasa-eonet";
import { fetchReliefWebDisasters } from "@/lib/api/reliefweb";
import { fetchSecFilings } from "@/lib/api/sec-edgar";
import { fetchWhoOutbreaks } from "@/lib/api/who-outbreaks";
import { fetchHackerNews } from "@/lib/api/hackernews";
import { fetchPubmedOutbreaks } from "@/lib/api/pubmed-outbreaks";
import type { IntelItem } from "@/types/intel";

/**
 * seed-to-events
 * -----------------------------------------------------------------------------
 * Bridges the existing structured free-API clients (GDELT, USGS, NASA EONET,
 * ReliefWeb, SEC EDGAR, WHO outbreaks, HackerNews, PubMed) into the `events`
 * Supabase table via persistEvents().
 *
 * Why this cron exists: these clients were previously only consumed by the
 * realtime /api/intel aggregator and written to Redis seed cache. That kept
 * them OUT of the persistent events table, which meant they never fed:
 *   - /feed.xml (reads events table)
 *   - The convergence engine (reads fetchPersistedEvents)
 *   - Daily/weekly reports
 *   - Country pages and blog generation
 *
 * persistEvents() uses url-based upsert with ignoreDuplicates, so overlapping
 * items already brought in by RSS feeds are silently dropped. Geocoding is
 * left ON — the geocoder is no-op for items that already have lat/lng
 * (USGS, NASA EONET, GDELT Geo), so the cost is bounded to text-only sources.
 *
 * Schedule: every 10 minutes via vercel.json.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

type SourceName =
  | "gdelt-doc"
  | "gdelt-geo"
  | "usgs"
  | "nasa-eonet"
  | "reliefweb"
  | "sec-edgar"
  | "who-outbreaks"
  | "hackernews"
  | "pubmed";

interface SourceResult {
  source: SourceName;
  fetched: number;
  error?: string;
}

async function safeFetch(
  source: SourceName,
  fn: () => Promise<IntelItem[]>
): Promise<{ result: SourceResult; items: IntelItem[] }> {
  try {
    const items = await fn();
    return {
      result: { source, fetched: items.length },
      items,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return {
      result: { source, fetched: 0, error: msg.slice(0, 120) },
      items: [],
    };
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  // Parallel fetch — Promise.all via allSettled inside safeFetch wrappers.
  const results = await Promise.all([
    safeFetch("gdelt-doc", () =>
      fetchGdeltArticles("conflict OR crisis OR attack OR cyberattack", 40)
    ),
    safeFetch("gdelt-geo", () =>
      fetchGdeltGeo("conflict OR attack OR protest OR disaster", 60)
    ),
    safeFetch("usgs", () => fetchEarthquakes()),
    safeFetch("nasa-eonet", () => fetchNasaEonet()),
    safeFetch("reliefweb", () => fetchReliefWebDisasters()),
    safeFetch("sec-edgar", () => fetchSecFilings("8-K", 20)),
    safeFetch("who-outbreaks", () => fetchWhoOutbreaks(15)),
    safeFetch("hackernews", () => fetchHackerNews(20)),
    safeFetch("pubmed", () => fetchPubmedOutbreaks()),
  ]);

  const allItems: IntelItem[] = [];
  const sourceStats: SourceResult[] = [];

  for (const { result, items } of results) {
    sourceStats.push(result);
    allItems.push(...items);
  }

  // Deduplicate within the batch on URL before hitting persistEvents
  // (otherwise Supabase upsert on same URL in one call errors out).
  const seenUrls = new Set<string>();
  const uniqueItems = allItems.filter((item) => {
    if (!item.url) return false;
    if (seenUrls.has(item.url)) return false;
    seenUrls.add(item.url);
    return true;
  });

  let inserted = 0;
  try {
    inserted = await persistEvents(uniqueItems);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "persist failed";
    return NextResponse.json(
      {
        success: false,
        error: msg.slice(0, 200),
        sourceStats,
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }

  console.log(
    `[seed-to-events] fetched=${allItems.length} unique=${uniqueItems.length} persisted=${inserted} duration=${Date.now() - startTime}ms`
  );

  return NextResponse.json({
    success: true,
    fetched: allItems.length,
    unique: uniqueItems.length,
    persisted: inserted,
    sourceStats,
    durationMs: Date.now() - startTime,
  });
}
