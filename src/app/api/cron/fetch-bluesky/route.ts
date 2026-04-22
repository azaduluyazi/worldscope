import { NextResponse } from "next/server";
import { fetchBlueskyWhatsHot } from "@/lib/api/bluesky";
import { persistEvents } from "@/lib/db/events";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Bluesky convergence cron.
 *
 * Runs every 15 minutes and pulls the public "What's Hot" feed, then pushes
 * the results through the same persistEvents() pipeline that RSS feeds use.
 * Downstream (convergence engine, dashboard, briefing) has no idea these
 * items came from Bluesky vs RSS — the source name is the only difference.
 *
 * Why separate cron instead of adding to fetch-feeds?
 *   1. Different rate-limit profile (public.api.bsky.app is anon-per-IP)
 *   2. Different failure mode should stay isolated from 573 RSS feeds
 *   3. Different cadence — 15min is plenty for trending signals
 *   4. Easier to disable without touching the main feed loop
 */

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

  try {
    const items = await fetchBlueskyWhatsHot();

    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        fetched: 0,
        persisted: 0,
        durationMs: Date.now() - startTime,
        note: "Feed returned no qualifying posts (below engagement threshold or non-EN)",
      });
    }

    const { count: persisted } = await persistEvents(items);

    console.log(
      `[Bluesky Cron] fetched ${items.length} posts, persisted ${persisted} new events (${Date.now() - startTime}ms)`
    );

    return NextResponse.json({
      success: true,
      fetched: items.length,
      persisted,
      durationMs: Date.now() - startTime,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[Bluesky Cron] Failed:", msg);
    return NextResponse.json(
      {
        success: false,
        error: msg,
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
