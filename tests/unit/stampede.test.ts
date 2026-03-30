import { describe, it, expect, vi, beforeEach } from "vitest";

let mockGetValue: unknown = null;

vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor() {}
    get = vi.fn(async () => mockGetValue);
    set = vi.fn().mockResolvedValue("OK");
  },
}));

describe("stampede protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetValue = null;
    // Reset module to clear in-flight map between tests
    vi.resetModules();
  });

  it("concurrent calls for same key invoke fetcher only ONCE", async () => {
    const { cachedFetch } = await import("@/lib/cache/redis");

    let resolveExternal: (v: unknown) => void;
    const fetcherPromise = new Promise((r) => { resolveExternal = r; });

    const fetcher = vi.fn(() => fetcherPromise as Promise<{ data: string }>);

    // Fire 3 concurrent requests
    const p1 = cachedFetch("dup-key", fetcher, 60);
    const p2 = cachedFetch("dup-key", fetcher, 60);
    const p3 = cachedFetch("dup-key", fetcher, 60);

    // Resolve the single fetch
    resolveExternal!({ data: "shared" });

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    expect(r1).toEqual({ data: "shared" });
    expect(r2).toEqual({ data: "shared" });
    expect(r3).toEqual({ data: "shared" });
    // Fetcher called exactly once (leader) — followers coalesced
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns cached data without calling fetcher on cache hit", async () => {
    mockGetValue = { data: "cached" };
    const { cachedFetch } = await import("@/lib/cache/redis");
    const fetcher = vi.fn().mockResolvedValue({ data: "fresh" });

    const result = await cachedFetch("hit-key", fetcher, 60);

    expect(result).toEqual({ data: "cached" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("followers can still fetch if leader fails", async () => {
    const { cachedFetch } = await import("@/lib/cache/redis");

    // First call: leader that will fail
    const failFetcher = vi.fn().mockRejectedValue(new Error("leader fail"));
    const p1 = cachedFetch("fail-key", failFetcher, 60).catch(() => "error");

    // Wait for the failure to propagate
    await p1;

    // Second call after leader cleaned up: should fetch successfully
    const successFetcher = vi.fn().mockResolvedValue({ data: "recovered" });
    const result = await cachedFetch("fail-key", successFetcher, 60);

    expect(result).toEqual({ data: "recovered" });
    expect(successFetcher).toHaveBeenCalledTimes(1);
  });
});
