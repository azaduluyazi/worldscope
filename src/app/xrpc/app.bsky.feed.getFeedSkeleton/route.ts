import { NextRequest, NextResponse } from "next/server";
import { FEEDS, fetchFeedPosts } from "@/lib/bluesky/feed-queries";

export const runtime = "edge";

/**
 * GET /xrpc/app.bsky.feed.getFeedSkeleton
 *
 * AT Protocol Feed Generator endpoint. Receives:
 *   ?feed=at://did:web:troiamedia.com/app.bsky.feed.generator/<rkey>
 *   ?cursor=...  (optional, for pagination)
 *   ?limit=...   (optional, capped at 100)
 *
 * Returns a skeleton of AT-URIs that Bluesky clients will hydrate
 * into full posts. We resolve the <rkey> to a feed definition from
 * src/lib/bluesky/feed-queries.ts and hit Bluesky's public search
 * API to pull matching posts.
 *
 * Bluesky spec: https://atproto.com/specs/xrpc
 */
export async function GET(request: NextRequest) {
  const feedParam = request.nextUrl.searchParams.get("feed");
  const cursor = request.nextUrl.searchParams.get("cursor");

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

  const result = await fetchFeedPosts(FEEDS[rkey], cursor);

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
