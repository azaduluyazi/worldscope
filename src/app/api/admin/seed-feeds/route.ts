import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { SEED_FEEDS } from "@/config/feeds";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * POST /api/admin/seed-feeds
 * Upserts all SEED_FEEDS into the Supabase `feeds` table.
 * Safe to call multiple times — uses upsert on url.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const db = createServerClient();

  const rows = SEED_FEEDS.map((feed) => ({
    name: feed.name,
    url: feed.url,
    category: feed.category,
    is_active: true,
    error_count: 0,
  }));

  // Batch upsert in chunks of 100
  const CHUNK = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { data, error } = await db
      .from("feeds")
      .upsert(chunk, {
        onConflict: "url",
        ignoreDuplicates: false,
      })
      .select("id");

    if (error) {
      errors++;
    } else if (data) {
      inserted += data.length;
    }
  }

  return NextResponse.json({
    success: true,
    totalFeeds: SEED_FEEDS.length,
    inserted,
    errors,
    durationMs: Date.now() - startTime,
  });
}
