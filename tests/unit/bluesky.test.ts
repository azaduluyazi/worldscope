import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchBlueskyWhatsHot } from "@/lib/api/bluesky";

/**
 * Tests for the Bluesky AT Protocol client.
 *
 * We don't hit the real network — fetch is mocked. The goal is to verify:
 *   1. Response shape mapping (Bluesky JSON → IntelItem)
 *   2. Engagement filter (posts below threshold dropped)
 *   3. Language filter (non-EN posts dropped)
 *   4. Repost filter (reposts dropped, original content only)
 *   5. Graceful failure (network errors return [] not throw)
 *   6. URL construction (at:// → bsky.app public URL)
 */

const originalFetch = global.fetch;

function mockFetchResponse(body: unknown, ok = true, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: async () => body,
  }) as unknown as typeof fetch;
}

function makePost(overrides: Record<string, unknown> = {}) {
  return {
    post: {
      uri: "at://did:plc:abc/app.bsky.feed.post/xyz123",
      cid: "bafyabcdef1234567890qwertyuiop",
      author: {
        did: "did:plc:abc",
        handle: "user.bsky.social",
        displayName: "Test User",
      },
      record: {
        text: "A global conflict is escalating between two major powers with NATO deployment imminent.",
        createdAt: "2026-04-08T10:00:00Z",
        langs: ["en"],
      },
      likeCount: 50,
      repostCount: 20,
      replyCount: 10,
      indexedAt: "2026-04-08T10:01:00Z",
      ...overrides,
    },
  };
}

describe("fetchBlueskyWhatsHot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("maps Bluesky posts to IntelItem with correct source name", async () => {
    mockFetchResponse({ feed: [makePost()] });

    const items = await fetchBlueskyWhatsHot();

    expect(items).toHaveLength(1);
    expect(items[0].source).toBe("Bluesky What's Hot");
    expect(items[0].id).toMatch(/^bsky-/);
    expect(items[0].title.length).toBeGreaterThan(0);
  });

  it("constructs a public bsky.app URL from the at:// URI", async () => {
    mockFetchResponse({ feed: [makePost()] });
    const items = await fetchBlueskyWhatsHot();
    expect(items[0].url).toBe("https://bsky.app/profile/user.bsky.social/post/xyz123");
  });

  it("categorizes using the shared RSS classifier", async () => {
    mockFetchResponse({ feed: [makePost()] });
    const items = await fetchBlueskyWhatsHot();
    // The test post contains "conflict", "NATO", "deployment" — all conflict keywords
    expect(items[0].category).toBe("conflict");
  });

  it("filters out posts below minimum engagement (5)", async () => {
    mockFetchResponse({
      feed: [
        makePost({ likeCount: 1, repostCount: 0, replyCount: 0 }),
        makePost({ likeCount: 2, repostCount: 1, replyCount: 0 }),
      ],
    });
    const items = await fetchBlueskyWhatsHot();
    expect(items).toHaveLength(0);
  });

  it("filters out non-English posts", async () => {
    mockFetchResponse({
      feed: [
        makePost({ record: { text: "Bonjour le monde des nouvelles internationales importantes", langs: ["fr"] } }),
      ],
    });
    const items = await fetchBlueskyWhatsHot();
    expect(items).toHaveLength(0);
  });

  it("drops reposts (only original content)", async () => {
    const response = {
      feed: [
        { ...makePost(), reason: { $type: "app.bsky.feed.defs#reasonRepost" } },
      ],
    };
    mockFetchResponse(response);
    const items = await fetchBlueskyWhatsHot();
    expect(items).toHaveLength(0);
  });

  it("drops posts with text shorter than 20 chars", async () => {
    mockFetchResponse({
      feed: [makePost({ record: { text: "too short", langs: ["en"] } })],
    });
    const items = await fetchBlueskyWhatsHot();
    expect(items).toHaveLength(0);
  });

  it("returns empty array on network error without throwing", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) as unknown as typeof fetch;
    const items = await fetchBlueskyWhatsHot();
    expect(items).toEqual([]);
  });

  it("returns empty array on non-2xx response", async () => {
    mockFetchResponse({}, false, 503);
    const items = await fetchBlueskyWhatsHot();
    expect(items).toEqual([]);
  });

  it("handles malformed feed shape gracefully", async () => {
    mockFetchResponse({ unexpected: "shape" });
    const items = await fetchBlueskyWhatsHot();
    expect(items).toEqual([]);
  });
});
