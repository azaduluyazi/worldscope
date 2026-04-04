import { createServerClient } from "./supabase";
import type { IntelItem } from "@/types/intel";

/**
 * Persist intel items to Supabase `events` table.
 * Uses upsert on url to avoid duplicates.
 * Runs fire-and-forget — failures don't block the API response.
 */
export async function persistEvents(items: IntelItem[]): Promise<number> {
  if (items.length === 0) return 0;

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
 */
export async function fetchPersistedEvents(
  options: {
    category?: string;
    limit?: number;
    hoursBack?: number;
  } = {}
): Promise<IntelItem[]> {
  const { category, limit = 1000, hoursBack = 48 } = options;
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

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((row) => ({
    id: `db-${row.id}`,
    title: row.title,
    summary: row.summary || "",
    url: row.url || "",
    source: row.source,
    category: row.category,
    severity: row.severity,
    publishedAt: row.published_at,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    countryCode: row.country_code ?? undefined,
    imageUrl: row.image_url ?? undefined,
  }));
}
