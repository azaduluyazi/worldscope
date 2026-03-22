import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { SEED_FEEDS } from "@/config/feeds";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/admin/seed-feeds
 * Populates the Supabase `feeds` table from SEED_FEEDS config.
 * Upserts on URL to avoid duplicates. Safe to call multiple times.
 */
export async function POST(request: Request) {
  // Simple auth check
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const adminKey = process.env.ADMIN_KEY;

  const isAuth =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (adminKey && authHeader === `Bearer ${adminKey}`) ||
    // Allow without auth in development
    process.env.NODE_ENV === "development";

  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServerClient();

  const rows = SEED_FEEDS.map((feed) => ({
    url: feed.url,
    name: feed.name,
    category: feed.category,
    language: feed.language || "en",
    is_active: true,
    error_count: 0,
  }));

  // Upsert in chunks of 50
  const CHUNK = 50;
  let upserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { data, error } = await db
      .from("feeds")
      .upsert(chunk, { onConflict: "url", ignoreDuplicates: false })
      .select("id");

    if (error) {
      errors++;
    } else {
      upserted += data?.length || 0;
    }
  }

  return NextResponse.json({
    success: true,
    totalSeeds: SEED_FEEDS.length,
    upserted,
    errors,
  });
}
