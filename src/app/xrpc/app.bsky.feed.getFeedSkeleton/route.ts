import { NextRequest, NextResponse } from "next/server";
import { FEEDS, fetchFeedPosts } from "@/lib/bluesky/feed-queries";
import { createServerClient } from "@/lib/db/supabase";

export const runtime = "nodejs";

/**
 * GET /xrpc/app.bsky.feed.getFeedSkeleton
 *
 * AT Protocol Feed Generator endpoint. Receives:
 *   ?feed=at://did:web:troiamedia.com/app.bsky.feed.generator/<rkey>
 *   ?cursor=...  (optional, for pagination — ISO timestamp)
 *   ?limit=...   (optional, capped at 100)
 *
 * Primary source: Postgres bluesky_posts table, populated by the
 * /api/cron/bluesky-ingest job every 10 minutes. This removes the
 * live dependency on Bluesky's public search API.
 *
 * Fallback: If the local table is empty (migration not run, or cron
 * not yet triggered), falls back to live Bluesky search so users
 * never see an empty feed.
 *
 * Spec: https://atproto.com/specs/xrpc
 */

interface PostRow {
  uri: string;
  created_at: string;
}

async function getFromDb(
  rkey: string,
  cursor: string | null,
  limit: number,
): Promise<{ feed: Array<{ post: string }>; cursor?: string }> {
  try {
    const db = createServerClient();
    let query = db
      .from("bluesky_posts")
      .select("uri, created_at")
      .eq("feed_rkey", rkey)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data, error } = await query;
    if (error || !data) return { feed: [] };

    const rows = data as PostRow[];
    const feed = rows.map((r) => ({ post: r.uri }));
    const nextCursor =
      rows.length === limit
        ? rows[rows.length - 1].created_at
        : undefined;

    return { feed, cursor: nextCursor };
  } catch {
    return { feed: [] };
  }
}

export async function GET(request: NextRequest) {
  const feedParam = request.nextUrl.searchParams.get("feed");
  const cursor = request.nextUrl.searchParams.get("cursor");
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam || "50", 10), 1), 100);

  if (!feedParam) {
    return NextResponse.json(
      { error: "InvalidRequest", message: "Missing 'feed' parameter" },
      { status: 400 },
    );
  }

  // Expect: at://did:web:troiamedia.com/app.bsky.feed.generator/<rkey>
  const rkey = feedParam.split("/").pop();
  if (!rkey || !FEEDS[rkey]) {
    return NextResponse.json(
      { error: "UnknownFeed", message: `Feed not found: ${rkey || feedParam}` },
      { status: 404 },
    );
  }

  // Primary: read from local Postgres index
  const dbResult = await getFromDb(rkey, cursor, limit);

  // Fallback: if DB empty (cron hasn't run yet), hit live Bluesky search
  if (dbResult.feed.length === 0 && !cursor) {
    const liveResult = await fetchFeedPosts(FEEDS[rkey]);
    return NextResponse.json(liveResult, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60",
        "x-feed-source": "live-fallback",
      },
    });
  }

  return NextResponse.json(dbResult, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=60",
      "x-feed-source": "db",
    },
  });
}
