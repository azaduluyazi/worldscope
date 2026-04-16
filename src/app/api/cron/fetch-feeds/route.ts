import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { fetchFeed } from "@/lib/api/rss-parser";
import { persistEvents } from "@/lib/db/events";
import { recordFeedSuccess, recordFeedError } from "@/lib/db/feed-health";
import { runEntityPipeline } from "@/lib/db/entity-pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BATCH_SIZE = 20;
const FEED_LIMIT = 300;

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
  let totalParsed = 0;
  let emptyFeeds = 0;
  const sampleErrors: string[] = [];
  const sampleSuccess: string[] = [];

  // Process feeds in batches
  for (let i = 0; i < feeds.length; i += BATCH_SIZE) {
    const batch = feeds.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (feed) => {
        try {
          const items = await fetchFeed(feed.url, feed.name);

          if (items.length > 0) {
            totalParsed += items.length;
            const persisted = await persistEvents(items);
            await recordFeedSuccess(feed.url);
            if (sampleSuccess.length < 3) {
              sampleSuccess.push(`${feed.name}: ${items.length} parsed, ${persisted} persisted`);
            }
            return { url: feed.url, items: persisted, error: false };
          }

          emptyFeeds++;
          await recordFeedSuccess(feed.url);
          return { url: feed.url, items: 0, error: false };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          if (sampleErrors.length < 5) {
            sampleErrors.push(`${feed.name}: ${msg.slice(0, 100)}`);
          }
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

  console.log(`[Feeds] Processed: ${feedsProcessed}, Parsed: ${totalParsed}, Persisted: ${totalItems}, Empty: ${emptyFeeds}, Errors: ${totalErrors}`);

  // ── Entity extraction pipeline ────────────────────────────────────
  // Runs on events created during this fetch window. Uses raw event IDs
  // (not the `db-` prefixed form) so story_entities.event_id stays a
  // direct join target for the events table.
  let entityResult: Awaited<ReturnType<typeof runEntityPipeline>> = {
    eventsProcessed: 0,
    entitiesUpserted: 0,
    linksCreated: 0,
    errors: 0,
  };
  try {
    const sinceIso = new Date(startTime).toISOString();
    const { data: freshEvents } = await db
      .from("events")
      .select("id, title, summary")
      .gte("created_at", sinceIso)
      .limit(500);
    if (freshEvents && freshEvents.length > 0) {
      entityResult = await runEntityPipeline(
        freshEvents.map((e) => ({ id: String(e.id), title: e.title, summary: e.summary }))
      );
      console.log(
        `[Entities] Processed: ${entityResult.eventsProcessed}, Upserted: ${entityResult.entitiesUpserted}, Links: ${entityResult.linksCreated}, Errors: ${entityResult.errors}`
      );
    }
  } catch (err) {
    console.error("[Entities] pipeline failed (non-fatal):", err);
  }

  return NextResponse.json({
    success: true,
    feedsProcessed,
    itemsParsed: totalParsed,
    itemsPersisted: totalItems,
    emptyFeeds,
    errors: totalErrors,
    entities: entityResult,
    durationMs: Date.now() - startTime,
    diagnostics: {
      sampleSuccess: sampleSuccess.length > 0 ? sampleSuccess : undefined,
      sampleErrors: sampleErrors.length > 0 ? sampleErrors : undefined,
    },
  });
}
