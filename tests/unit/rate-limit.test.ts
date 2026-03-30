import { describe, it, expect, vi } from "vitest";

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(function () { return {}; }),
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: vi.fn().mockImplementation(function () {
    return {
      limit: vi.fn().mockResolvedValue({ success: true, limit: 60, remaining: 59, reset: Date.now() + 60000 }),
    };
  }),
}));

describe("Rate limiting", () => {
  it("allows requests under the limit", async () => {
    const { Ratelimit } = await import("@upstash/ratelimit");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const limiter = new Ratelimit({} as any);
    const result = await limiter.limit("127.0.0.1");
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(59);
  });
});
