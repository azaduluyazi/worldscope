/**
 * Bluesky feed query definitions — maps feed rkey → search params.
 *
 * Each feed uses Bluesky's public searchPosts XRPC endpoint to pull
 * recent matching posts. This is a stateless approach — no firehose,
 * no local index. It scales as far as searchPosts itself scales.
 *
 * The AT-URIs this returns are real Bluesky post URIs, not our own
 * content. We curate other people's posts; Bluesky users subscribe to
 * the curation. Attribution footer in the feed description drives
 * traffic back to troiamedia.com.
 */

const BSKY_PUBLIC_API =
  "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts";

export interface FeedDefinition {
  rkey: string;
  displayName: string;
  description: string;
  query: string;
  sort?: "top" | "latest";
  limit?: number;
}

export const FEEDS: Record<string, FeedDefinition> = {
  "osint-firehose": {
    rkey: "osint-firehose",
    displayName: "OSINT Firehose",
    description:
      "Curated open-source intelligence signals from across Bluesky. Conflict, cyber, geopolitics, verification. Powered by WorldScope at troiamedia.com.",
    query: "OSINT OR geolocated OR #OSINT OR verified",
    sort: "latest",
    limit: 50,
  },
  "breaking-world": {
    rkey: "breaking-world",
    displayName: "Breaking World",
    description:
      "Breaking world events as they surface on Bluesky. Diplomatic, security, economic signals. Powered by WorldScope at troiamedia.com.",
    query: "breaking OR BREAKING",
    sort: "latest",
    limit: 50,
  },
  "turkiye-focus": {
    rkey: "turkiye-focus",
    displayName: "Türkiye Intelligence",
    description:
      "Türkiye-focused geopolitical and security signals from Bluesky. Powered by WorldScope at troiamedia.com.",
    query: "Türkiye OR Turkey OR Türkiye",
    sort: "latest",
    limit: 50,
  },
};

interface BskyPost {
  uri: string;
  cid: string;
  indexedAt: string;
}

interface BskySearchResponse {
  posts?: BskyPost[];
  cursor?: string;
}

/**
 * Fetch a feed's post list from Bluesky's public search API.
 * Returns AT-URIs in the shape Bluesky's getFeedSkeleton expects.
 */
export async function fetchFeedPosts(
  feed: FeedDefinition,
  cursor?: string | null,
): Promise<{ feed: Array<{ post: string }>; cursor?: string }> {
  const params = new URLSearchParams({
    q: feed.query,
    sort: feed.sort || "latest",
    limit: String(feed.limit || 50),
  });
  if (cursor) params.set("cursor", cursor);

  try {
    const res = await fetch(`${BSKY_PUBLIC_API}?${params}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return { feed: [] };
    }

    const data = (await res.json()) as BskySearchResponse;
    const posts = data.posts || [];
    return {
      feed: posts.map((p) => ({ post: p.uri })),
      cursor: data.cursor,
    };
  } catch {
    return { feed: [] };
  }
}
