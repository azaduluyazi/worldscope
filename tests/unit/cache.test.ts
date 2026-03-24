import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@upstash/redis", () => {
  const mockRedis = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
  };
  return {
    Redis: class {
      constructor() {}
      get = mockRedis.get;
      set = mockRedis.set;
    },
  };
});

describe("cache TTL constants", () => {
  it("has expected TTL values", async () => {
    const { TTL } = await import("@/lib/cache/redis");
    expect(TTL.MARKET).toBe(60);
    expect(TTL.NEWS).toBe(180);
    expect(TTL.RSS).toBe(600);
    expect(TTL.THREAT).toBe(300);
    expect(TTL.AI_BRIEF).toBe(3600);
  });
});

describe("cachedFetch", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls fetcher when cache misses", async () => {
    const { cachedFetch } = await import("@/lib/cache/redis");
    const fetcher = vi.fn().mockResolvedValue({ result: "fresh" });
    const result = await cachedFetch("test-key", fetcher, 60);
    expect(result).toEqual({ result: "fresh" });
  });
});
