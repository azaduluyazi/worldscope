import { describe, it, expect, vi } from "vitest";

vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor() {}
    get = vi.fn().mockResolvedValue(null);
    set = vi.fn().mockResolvedValue("OK");
  },
}));

describe("cache tier values", () => {
  it("has all 6 primary tiers with correct seconds", async () => {
    const { TTL } = await import("@/lib/cache/redis");

    expect(TTL.REALTIME).toBe(15);
    expect(TTL.FAST).toBe(60);
    expect(TTL.MEDIUM).toBe(300);
    expect(TTL.SLOW).toBe(600);
    expect(TTL.STATIC).toBe(3600);
    expect(TTL.DAILY).toBe(86_400);
  });

  it("legacy aliases still work and match expected values", async () => {
    const { TTL } = await import("@/lib/cache/redis");

    expect(TTL.MARKET).toBe(TTL.FAST);       // MARKET -> FAST
    expect(TTL.NEWS).toBe(180);               // NEWS stays 180 (legacy)
    expect(TTL.FIVE_MIN).toBe(TTL.MEDIUM);    // FIVE_MIN -> MEDIUM
    expect(TTL.THREAT).toBe(TTL.MEDIUM);      // THREAT -> MEDIUM
    expect(TTL.AI_BRIEF).toBe(TTL.STATIC);    // AI_BRIEF -> STATIC
    expect(TTL.RSS).toBe(TTL.SLOW);           // RSS -> SLOW
  });
});
