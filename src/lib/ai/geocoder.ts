import { generateObject } from "ai";
import { briefModel } from "./providers";
import { z } from "zod";
import type { IntelItem } from "@/types/intel";

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

/**
 * Use AI to estimate geo-coordinates for events that lack them.
 * Processes in batches to stay within token limits.
 * Only assigns coordinates with medium+ confidence.
 */
export async function geocodeEvents(
  items: IntelItem[]
): Promise<Map<number, { lat: number; lng: number }>> {
  const results = new Map<number, { lat: number; lng: number }>();

  // Only process items without coordinates
  const needsGeo = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.lat == null || item.lng == null);

  if (needsGeo.length === 0) return results;

  // Process in batches of 15
  const BATCH = 15;
  for (let i = 0; i < Math.min(needsGeo.length, 45); i += BATCH) {
    const batch = needsGeo.slice(i, i + BATCH);

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
        prompt: `For each news headline, estimate the most likely geographic coordinates (latitude, longitude) based on the location mentioned or implied. If no location can be determined, skip that item. Only include items where you have medium or high confidence.

${prompt}`,
      });

      for (const geo of object.items) {
        if (geo.confidence !== "low") {
          results.set(geo.index, { lat: geo.lat, lng: geo.lng });
        }
      }
    } catch {
      // AI geocoding is best-effort — failures are fine
    }
  }

  return results;
}

/**
 * Apply AI geocoding to items array, mutating lat/lng in place.
 * Returns number of items geocoded.
 */
export async function applyGeocoding(items: IntelItem[]): Promise<number> {
  const geoMap = await geocodeEvents(items);

  let count = 0;
  for (const [index, coords] of geoMap) {
    if (items[index]) {
      items[index].lat = coords.lat;
      items[index].lng = coords.lng;
      count++;
    }
  }

  return count;
}
