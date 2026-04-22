import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { FEEDS, type FeedDefinition } from "@/lib/bluesky/feed-queries";

export const runtime = "nodejs";

/**
 * GET /api/cron/bluesky-ingest
 *
 * Pulls recent posts matching each feed's query from Bluesky's
 * public searchPosts API and upserts them into bluesky_posts.
 * Runs every 10 minutes (vercel.json). Also prunes rows older
 * than 7 days via the prune_bluesky_posts() RPC.
 *
 * This removes the live-search dependency from getFeedSkeleton:
 * queries hit our local Postgres instead of Bluesky's public API.
 *
 * Auth: Bearer CRON_SECRET
 */

interface BskyAuthor {
  did?: string;
  handle?: string;
}

interface BskyRecord {
  text?: string;
  createdAt?: string;
  langs?: string[];
}

interface BskyPost {
  uri: string;
  cid: string;
  author?: BskyAuthor;
  record?: BskyRecord;
  indexedAt?: string;
}

interface BskySearchResponse {
  posts?: BskyPost[];
}

const BSKY_SEARCH =
  "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts";

async function ingestFeed(
  feed: FeedDefinition,
  supabase: ReturnType<typeof createServerClient>,
): Promise<{ fetched: number; inserted: number; error?: string }> {
  const params = new URLSearchParams({
    q: feed.query,
    sort: feed.sort || "latest",
    limit: "100",
  });

  let posts: BskyPost[] = [];
  try {
    const res = await fetch(`${BSKY_SEARCH}?${params}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return { fetched: 0, inserted: 0, error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as BskySearchResponse;
    posts = data.posts || [];
  } catch (e) {
    return {
      fetched: 0,
      inserted: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  if (posts.length === 0) {
    return { fetched: 0, inserted: 0 };
  }

  const rows = posts
    .filter((p) => p.uri && p.cid)
    .map((p) => ({
      uri: p.uri,
      cid: p.cid,
      feed_rkey: feed.rkey,
      author_did: p.author?.did || null,
      author_handle: p.author?.handle || null,
      text: (p.record?.text || "").slice(0, 4000),
      created_at:
        p.record?.createdAt || p.indexedAt || new Date().toISOString(),
      langs: p.record?.langs || null,
    }));

  const { error } = await supabase
    .from("bluesky_posts")
    .upsert(rows, { onConflict: "uri", ignoreDuplicates: false });

  if (error) {
    return {
      fetched: rows.length,
      inserted: 0,
      error: error.message,
    };
  }

  return { fetched: rows.length, inserted: rows.length };
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  const results: Record<string, { fetched: number; inserted: number; error?: string }> =
    {};
  let totalInserted = 0;

  for (const feed of Object.values(FEEDS)) {
    const r = await ingestFeed(feed, supabase);
    results[feed.rkey] = r;
    totalInserted += r.inserted;
  }

  // Prune old rows
  let pruned = 0;
  try {
    const { data } = await supabase.rpc("prune_bluesky_posts");
    pruned = (data as number) || 0;
  } catch (err) {
    console.error("[cron/bluesky-ingest]", err);
    // non-fatal
  }

  return NextResponse.json({
    ok: true,
    totalInserted,
    pruned,
    feeds: results,
  });
}
