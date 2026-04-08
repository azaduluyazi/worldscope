import { generateObject } from "ai";
import { createHash } from "node:crypto";
import { briefModel } from "./providers";
import { z } from "zod";
import type { IntelItem } from "@/types/intel";
import { redis } from "@/lib/cache/redis";

// ═══════════════════════════════════════════════════════════════════
//  AI Geocoder — v2 (Task B fix)
// ═══════════════════════════════════════════════════════════════════
//
//  v1 problems fixed:
//    1. DEAD CODE — applyGeocoding() was never called from any
//       ingestion path. Now wired into fetch-feeds cron.
//    2. CAPPED AT 45 — Math.min(needsGeo.length, 45) limited output
//       to ~45 items/run. A feed cycle ingests 500-2000 items, so
//       most got persisted without coordinates. Raised to 300.
//    3. NO CACHE — same article title was re-geocoded every time it
//       appeared in subsequent feed polls. Now cached in Redis by
//       content hash for 30 days.
//    4. NO METRICS — silent failures meant nobody knew it was broken.
//       Now returns detailed stats.
//
// ═══════════════════════════════════════════════════════════════════

const GeoResult = z.object({
  items: z.array(
    z.object({
      index: z.number(),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      confidence: z.enum(["high", "medium", "low"]),
    })
  ),
});

const CACHE_PREFIX = "geo:title:";
const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const CACHE_NEGATIVE_MARKER = "NONE"; // stored when AI returned nothing
const BATCH_SIZE = 15;
const MAX_ITEMS_PER_RUN = 300;

/** SHA1 hash of the title for cache keys — stable across runs */
function titleHash(title: string): string {
  return createHash("sha1").update(title.trim().toLowerCase()).digest("hex").slice(0, 16);
}

interface CachedGeo {
  lat: number;
  lng: number;
}

async function getCached(title: string): Promise<CachedGeo | "none" | null> {
  try {
    const key = CACHE_PREFIX + titleHash(title);
    const raw = await redis.get<string | CachedGeo>(key);
    if (raw === null || raw === undefined) return null;
    if (raw === CACHE_NEGATIVE_MARKER) return "none";
    if (typeof raw === "object" && "lat" in raw && "lng" in raw) return raw as CachedGeo;
    // Legacy / unexpected format — treat as miss
    return null;
  } catch {
    return null;
  }
}

async function setCached(title: string, value: CachedGeo | "none"): Promise<void> {
  try {
    const key = CACHE_PREFIX + titleHash(title);
    const storedValue = value === "none" ? CACHE_NEGATIVE_MARKER : value;
    await redis.set(key, storedValue, { ex: CACHE_TTL_SECONDS });
  } catch {
    // Cache write failure is non-fatal
  }
}

export interface GeocodeStats {
  total: number;
  alreadyGeoTagged: number;
  cachedHits: number;
  cachedNegative: number;
  llmCalls: number;
  llmSuccess: number;
  llmMiss: number;
  llmErrors: number;
  newlyGeocoded: number;
}

/**
 * Use AI to estimate geo-coordinates for events that lack them.
 * Processes in batches, with Redis caching to avoid re-geocoding the
 * same title across multiple feed polls.
 *
 * Returns a map of input-array-index → coordinates for all items
 * that were successfully geocoded (whether from cache or LLM).
 */
export async function geocodeEvents(
  items: IntelItem[]
): Promise<{ coords: Map<number, CachedGeo>; stats: GeocodeStats }> {
  const coords = new Map<number, CachedGeo>();
  const stats: GeocodeStats = {
    total: items.length,
    alreadyGeoTagged: 0,
    cachedHits: 0,
    cachedNegative: 0,
    llmCalls: 0,
    llmSuccess: 0,
    llmMiss: 0,
    llmErrors: 0,
    newlyGeocoded: 0,
  };

  // Separate items: already geo-tagged, cached, need LLM
  const needsLLM: { item: IntelItem; index: number }[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.lat != null && item.lng != null) {
      stats.alreadyGeoTagged++;
      continue;
    }
    const cached = await getCached(item.title);
    if (cached === "none") {
      stats.cachedNegative++;
      continue;
    }
    if (cached) {
      coords.set(i, cached);
      stats.cachedHits++;
      continue;
    }
    needsLLM.push({ item, index: i });
  }

  // Cap at MAX_ITEMS_PER_RUN to bound API cost per cron
  const toProcess = needsLLM.slice(0, MAX_ITEMS_PER_RUN);

  // Batch through LLM
  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);
    stats.llmCalls++;

    const prompt = batch
      .map(
        ({ item, index }) =>
          `[${index}] "${item.title}" (source: ${item.source}, category: ${item.category})`
      )
      .join("\n");

    try {
      const { object } = await generateObject({
        model: briefModel,
        schema: GeoResult,
        prompt: `For each news headline, estimate the most likely geographic coordinates (latitude, longitude) based on the location mentioned or implied. Use the most specific place you can infer (city > region > country). If no location can be determined, skip that item entirely. Only include items where you have medium or high confidence.

${prompt}`,
      });

      // Track which indices got a result (for negative caching)
      const returnedIndices = new Set(object.items.map((g) => g.index));

      for (const geo of object.items) {
        if (geo.confidence !== "low") {
          const result = { lat: geo.lat, lng: geo.lng };
          coords.set(geo.index, result);
          stats.llmSuccess++;

          // Cache positive result
          const sourceItem = items[geo.index];
          if (sourceItem) {
            await setCached(sourceItem.title, result);
          }
        }
      }

      // Cache negative results (items the LLM couldn't locate)
      for (const { item, index } of batch) {
        if (!returnedIndices.has(index)) {
          stats.llmMiss++;
          await setCached(item.title, "none");
        }
      }
    } catch {
      // AI geocoding is best-effort — failures are fine, don't cache
      stats.llmErrors++;
    }
  }

  stats.newlyGeocoded = coords.size - stats.cachedHits;
  return { coords, stats };
}

/**
 * Apply AI geocoding to items array, mutating lat/lng in place.
 * Returns detailed stats.
 */
export async function applyGeocoding(items: IntelItem[]): Promise<GeocodeStats> {
  const { coords, stats } = await geocodeEvents(items);

  for (const [index, c] of coords) {
    const target = items[index];
    if (target) {
      target.lat = c.lat;
      target.lng = c.lng;
    }
  }

  return stats;
}
