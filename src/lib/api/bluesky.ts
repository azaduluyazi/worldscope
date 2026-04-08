/**
 * Bluesky AT Protocol client — public feed firehose.
 *
 * Bluesky doesn't expose an RSS feed, so this module talks to the public
 * AT Protocol endpoint (no auth required for public feeds). Results are
 * mapped into the same IntelItem shape that the RSS pipeline produces,
 * so the convergence engine treats them uniformly.
 *
 * Rate limit: public.api.bsky.app is anonymous but rate-limited per IP.
 * We pull ~50 items per call and the cron runs every 15 minutes, which
 * is well under any reasonable threshold.
 *
 * No env vars required — this uses the unauthenticated public API.
 * If we ever need higher limits, swap to the authenticated endpoint
 * (bsky.social) and reuse BLUESKY_APP_PASSWORD from the social-post cron.
 */

import { categorizeFeedItem, mapSeverity } from "./rss-parser";
import type { IntelItem } from "@/types/intel";

const BLUESKY_PUBLIC_API = "https://public.api.bsky.app/xrpc";

/** The curated "What's Hot" feed — trending posts across the network */
const WHATS_HOT_FEED_URI =
  "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot";

/** Keep under Vercel Edge response size; cron processes & discards fast */
const MAX_POSTS_PER_FETCH = 50;

interface BlueskyAuthor {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

interface BlueskyRecord {
  text: string;
  createdAt?: string;
  langs?: string[];
  embed?: {
    images?: { alt?: string; image?: unknown }[];
    external?: { uri: string; title: string; description: string };
  };
}

interface BlueskyPost {
  uri: string;        // at:// URI, unique key
  cid: string;        // content ID
  author: BlueskyAuthor;
  record: BlueskyRecord;
  replyCount?: number;
  repostCount?: number;
  likeCount?: number;
  indexedAt: string;
}

interface BlueskyFeedItem {
  post: BlueskyPost;
  reason?: { $type: string };
}

interface BlueskyFeedResponse {
  feed: BlueskyFeedItem[];
  cursor?: string;
}

/**
 * Minimum engagement for a post to be worth ingesting.
 * Bluesky's What's Hot feed sometimes surfaces low-engagement content
 * from small accounts — we want established-signal posts only.
 */
const MIN_ENGAGEMENT = 5; // likes + reposts + replies

/**
 * Convert an at:// URI to a user-facing bsky.app URL for deep-linking.
 * at://did:plc:xxx/app.bsky.feed.post/abc → https://bsky.app/profile/<handle>/post/abc
 */
function atUriToPublicUrl(uri: string, handle: string): string {
  const parts = uri.split("/");
  const postId = parts[parts.length - 1];
  return `https://bsky.app/profile/${handle}/post/${postId}`;
}

/**
 * Fetch the Bluesky "What's Hot" feed and return posts as IntelItem[].
 *
 * @returns Array of IntelItem mapped from trending Bluesky posts.
 *          Returns empty array on fetch failure — never throws.
 */
export async function fetchBlueskyWhatsHot(): Promise<IntelItem[]> {
  const url =
    `${BLUESKY_PUBLIC_API}/app.bsky.feed.getFeed` +
    `?feed=${encodeURIComponent(WHATS_HOT_FEED_URI)}` +
    `&limit=${MAX_POSTS_PER_FETCH}`;

  try {
    const res = await fetch(url, {
      // No auth, no cookies, timeout via AbortController
      signal: AbortSignal.timeout(12_000),
      headers: {
        "Accept": "application/json",
        "User-Agent": "WorldScope-Convergence/1.0 (+https://troiamedia.com)",
      },
    });

    if (!res.ok) {
      console.warn(`[Bluesky] API returned ${res.status} ${res.statusText}`);
      return [];
    }

    const data = (await res.json()) as BlueskyFeedResponse;
    if (!Array.isArray(data.feed)) return [];

    return data.feed
      .map(mapBlueskyPostToIntelItem)
      .filter((item): item is IntelItem => item !== null);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Bluesky] Fetch failed: ${msg.slice(0, 150)}`);
    return [];
  }
}

/**
 * Map a single Bluesky post to an IntelItem, or return null if it should
 * be filtered out (low engagement, no text, spam patterns, non-English, etc.).
 */
function mapBlueskyPostToIntelItem(item: BlueskyFeedItem): IntelItem | null {
  const post = item.post;
  const text = post.record?.text?.trim();

  // Skip empty posts
  if (!text || text.length < 20) return null;

  // Skip reposts — we want original content only (they show up as item.reason)
  if (item.reason?.$type === "app.bsky.feed.defs#reasonRepost") return null;

  // Engagement gate — filter out low-signal content
  const engagement =
    (post.likeCount ?? 0) + (post.repostCount ?? 0) + (post.replyCount ?? 0);
  if (engagement < MIN_ENGAGEMENT) return null;

  // Language filter — only EN for now (our category classifier is EN-trained)
  const langs = post.record.langs;
  if (langs && langs.length > 0 && !langs.includes("en")) return null;

  // Extract title vs summary: first line or first 80 chars as "title"
  const firstLineBreak = text.indexOf("\n");
  const title =
    firstLineBreak > 0 && firstLineBreak < 120
      ? text.slice(0, firstLineBreak).trim()
      : text.slice(0, 120).trim() + (text.length > 120 ? "…" : "");

  const summary = text.length > 120 ? text.slice(0, 500) : text;

  // Reuse the RSS parser's keyword classifier — consistent categorization
  // across all sources is important for the convergence engine.
  const category = categorizeFeedItem(title + " " + summary);
  const severity = mapSeverity(title + " " + summary);

  // Public URL for deep-linking users to the original post
  const publicUrl = atUriToPublicUrl(post.uri, post.author.handle);

  // Image URL if the post has an image attachment
  const firstImage = post.record.embed?.images?.[0];
  const imageUrl =
    firstImage && typeof firstImage === "object"
      ? undefined // Bluesky image CIDs need resolution — skip for now
      : undefined;

  return {
    id: `bsky-${post.cid.slice(0, 20)}`,
    title,
    summary,
    url: publicUrl,
    source: "Bluesky What's Hot",
    category,
    severity,
    publishedAt: post.indexedAt || post.record.createdAt || new Date().toISOString(),
    imageUrl,
  };
}
