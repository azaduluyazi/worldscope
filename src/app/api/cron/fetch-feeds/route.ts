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
  const newEventIds: string[] = [];

  // Process feeds in batches
  for (let i = 0; i < feeds.length; i += BATCH_SIZE) {
    const batch = feeds.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (feed) => {
        try {
          const items = await fetchFeed(feed.url, feed.name);

          if (items.length > 0) {
            totalParsed += items.length;
            const { count, insertedIds } = await persistEvents(items);
            await recordFeedSuccess(feed.url);
            if (sampleSuccess.length < 3) {
              sampleSuccess.push(`${feed.name}: ${items.length} parsed, ${count} persisted`);
            }
            return { url: feed.url, items: count, insertedIds, error: false };
          }

          emptyFeeds++;
          await recordFeedSuccess(feed.url);
          return { url: feed.url, items: 0, insertedIds: [], error: false };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          if (sampleErrors.length < 5) {
            sampleErrors.push(`${feed.name}: ${msg.slice(0, 100)}`);
          }
          await recordFeedError(feed.url);
          return { url: feed.url, items: 0, insertedIds: [] as string[], error: true };
        }
      })
    );

    for (const result of results) {
      feedsProcessed++;
      if (result.status === "fulfilled") {
        totalItems += result.value.items;
        for (const id of result.value.insertedIds) newEventIds.push(id);
        if (result.value.error) totalErrors++;
      } else {
        totalErrors++;
      }
    }
  }

  console.log(`[Feeds] Processed: ${feedsProcessed}, Parsed: ${totalParsed}, Persisted: ${totalItems}, Empty: ${emptyFeeds}, Errors: ${totalErrors}`);

  // ── Entity extraction pipeline ────────────────────────────────────
  // Runs strictly on rows persistEvents() just inserted (IDs collected
  // from the upsert return). No timestamp-column query, so it's
  // schema-drift proof — see sorunlar/entities-zero-rows-column-drift.
  let entityResult: Awaited<ReturnType<typeof runEntityPipeline>> = {
    eventsProcessed: 0,
    entitiesUpserted: 0,
    linksCreated: 0,
    errors: 0,
  };
  try {
    if (newEventIds.length > 0) {
      // Cap at 500 to keep the pipeline within the cron's maxDuration budget.
      const ids = newEventIds.slice(0, 500);
      const { data: freshEvents, error: freshErr } = await db
        .from("events")
        .select("id, title, summary")
        .in("id", ids);
      if (freshErr) {
        console.error("[Entities] fresh-event fetch failed:", freshErr);
      }
      if (freshEvents && freshEvents.length > 0) {
        entityResult = await runEntityPipeline(
          freshEvents.map((e) => ({ id: String(e.id), title: e.title, summary: e.summary }))
        );
        console.log(
          `[Entities] Processed: ${entityResult.eventsProcessed}, Upserted: ${entityResult.entitiesUpserted}, Links: ${entityResult.linksCreated}, Errors: ${entityResult.errors}`
        );
      }
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
