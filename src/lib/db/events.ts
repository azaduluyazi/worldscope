import { createServerClient } from "./supabase";
import type { IntelItem } from "@/types/intel";
import { applyGeocoding } from "@/lib/ai/geocoder";

/**
 * Persist intel items to Supabase `events` table.
 * Uses upsert on url to avoid duplicates.
 * Runs fire-and-forget — failures don't block the API response.
 *
 * v3.5: auto-applies AI geocoding before persist. Items that already
 * have lat/lng are untouched. Items that don't get Groq-based location
 * extraction (with Redis cache to avoid re-geocoding the same title).
 * Geocoding failures are silent — items just persist without coords.
 *
 * Pass skipGeocoding: true if the caller already handled location
 * (e.g., USGS feed which has authoritative coordinates).
 */
export async function persistEvents(
  items: IntelItem[],
  options: { skipGeocoding?: boolean } = {}
): Promise<number> {
  if (items.length === 0) return 0;

  // AI geocoding pass (best-effort, cached, silent on failure)
  if (!options.skipGeocoding) {
    try {
      const stats = await applyGeocoding(items);
      if (stats.newlyGeocoded > 0 || stats.cachedHits > 0) {
        console.log(
          `[persistEvents] geocoded: ${stats.newlyGeocoded} new, ${stats.cachedHits} cached, ${stats.llmMiss} miss, ${stats.llmErrors} errors (of ${stats.total} items, ${stats.alreadyGeoTagged} pre-tagged)`
        );
      }
    } catch (err) {
      console.error("[persistEvents] geocoding failed:", err);
      // Continue — persist items without coords is fine
    }
  }

  const db = createServerClient();

  // Map IntelItem → events table row
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const rows = items
    .filter((item) => item.url) // Skip items without URL (can't deduplicate)
    .map((item) => ({
      source: item.source,
      category: item.category,
      severity: item.severity,
      title: item.title.slice(0, 500),
      summary: item.summary?.slice(0, 1000) || null,
      url: item.url,
      image_url: item.imageUrl || null,
      lat: item.lat ?? null,
      lng: item.lng ?? null,
      country_code: item.countryCode || null,
      published_at: item.publishedAt,
      expires_at: expiresAt,
    }));

  if (rows.length === 0) return 0;

  // Batch upsert in chunks of 100 (Supabase limit)
  const CHUNK = 100;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { data, error } = await db
      .from("events")
      .upsert(chunk, {
        onConflict: "url",
        ignoreDuplicates: true,
      })
      .select("id");

    if (error) {
      console.error("[DB] persistEvents upsert error:", error.message);
    }
    if (data) {
      inserted += data.length;
    }
  }

  return inserted;
}

/**
 * Fetch recent events from Supabase (for when external APIs are slow/down).
 * Acts as a fallback data source.
 *
 * IMPORTANT: Supabase API hard-caps at 1000 rows per query unless the
 * project's `db-max-rows` setting is raised. The default `limit: 1000`
 * here exists to make that cap explicit.
 *
 * For the convergence engine, pass `geoOnly: true` so we don't waste
 * the 1000-row budget pulling RSS items that lack lat/lng — those are
 * useless for spatial correlation anyway.
 */
export async function fetchPersistedEvents(
  options: {
    category?: string;
    limit?: number;
    hoursBack?: number;
    /** When true, only return events with non-null lat/lng. */
    geoOnly?: boolean;
    /**
     * When true, only return events WITHOUT lat/lng. This is the
     * input population for the topic-similarity track of the
     * convergence engine. Mutually exclusive with geoOnly — if both
     * are set, nonGeoOnly wins (explicit topic-track request).
     */
    nonGeoOnly?: boolean;
  } = {}
): Promise<IntelItem[]> {
  const {
    category,
    limit = 1000,
    hoursBack = 48,
    geoOnly = false,
    nonGeoOnly = false,
  } = options;
  const db = createServerClient();

  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

  let query = db
    .from("events")
    .select("*")
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (category) {
    query = query.eq("category", category);
  }

  if (nonGeoOnly) {
    // Either lat or lng is null → row is non-geo. Supabase `.or` takes
    // a comma-separated logical expression.
    query = query.or("lat.is.null,lng.is.null");
  } else if (geoOnly) {
    query = query.not("lat", "is", null).not("lng", "is", null);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map(mapEventRowToIntel);
}

/**
 * Shared mapper — used by fetchPersistedEvents and fetchEventsByIds.
 * Kept as a plain function (not a class method) so it remains tree-shake
 * friendly for client bundles that import only the types.
 */
function mapEventRowToIntel(row: {
  id: string | number;
  title: string;
  summary: string | null;
  url: string | null;
  source: string;
  category: string;
  severity: string;
  published_at: string;
  lat: number | null;
  lng: number | null;
  country_code: string | null;
  image_url: string | null;
}): IntelItem {
  return {
    id: `db-${row.id}`,
    title: row.title,
    summary: row.summary || "",
    url: row.url || "",
    source: row.source,
    category: row.category as IntelItem["category"],
    severity: row.severity as IntelItem["severity"],
    publishedAt: row.published_at,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    countryCode: row.country_code ?? undefined,
    imageUrl: row.image_url ?? undefined,
  };
}

/**
 * Fetch events by a list of IDs. Accepts both raw event IDs (as stored
 * in the DB) and the `db-${id}` prefixed form produced by
 * fetchPersistedEvents — the prefix is stripped before querying.
 * Preserves order by published_at DESC.
 */
export async function fetchEventsByIds(ids: string[]): Promise<IntelItem[]> {
  if (ids.length === 0) return [];
  const rawIds = ids.map((id) => (id.startsWith("db-") ? id.slice(3) : id));
  const db = createServerClient();
  const { data, error } = await db
    .from("events")
    .select("*")
    .in("id", rawIds)
    .order("published_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapEventRowToIntel);
}
