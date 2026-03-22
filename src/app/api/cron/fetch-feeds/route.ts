import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { fetchFeed } from "@/lib/api/rss-parser";
import { persistEvents } from "@/lib/db/events";
import { recordFeedSuccess, recordFeedError } from "@/lib/db/feed-health";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BATCH_SIZE = 15;
const FEED_LIMIT = 200;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) return false;

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const db = createServerClient();

  // Fetch the 200 oldest-unfetched active feeds
  const { data: feeds, error: fetchError } = await db
    .from("feeds")
    .select("id, url, name, category")
    .eq("is_active", true)
    .lt("error_count", 5)
    .order("last_fetched_at", { ascending: true, nullsFirst: true })
    .limit(FEED_LIMIT);

  if (fetchError || !feeds || feeds.length === 0) {
    return NextResponse.json({
      success: true,
      feedsProcessed: 0,
      itemsPersisted: 0,
      errors: 0,
      durationMs: Date.now() - startTime,
    });
  }

  let totalItems = 0;
  let totalErrors = 0;
  let feedsProcessed = 0;

  // Process feeds in batches of 10
  for (let i = 0; i < feeds.length; i += BATCH_SIZE) {
    const batch = feeds.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (feed) => {
        try {
          const items = await fetchFeed(feed.url, feed.name);

          if (items.length > 0) {
            const persisted = await persistEvents(items);
            await recordFeedSuccess(feed.url);
            return { url: feed.url, items: persisted, error: false };
          }

          // No items returned — could be empty feed or soft failure
          await recordFeedSuccess(feed.url);
          return { url: feed.url, items: 0, error: false };
        } catch {
          await recordFeedError(feed.url);
          return { url: feed.url, items: 0, error: true };
        }
      })
    );

    for (const result of results) {
      feedsProcessed++;
      if (result.status === "fulfilled") {
        totalItems += result.value.items;
        if (result.value.error) totalErrors++;
      } else {
        totalErrors++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    feedsProcessed,
    itemsPersisted: totalItems,
    errors: totalErrors,
    durationMs: Date.now() - startTime,
  });
}
