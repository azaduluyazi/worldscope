import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRedis = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue("OK"),
  del: vi.fn().mockResolvedValue(1),
};

vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor() {}
    get = mockRedis.get;
    set = mockRedis.set;
    del = mockRedis.del;
  },
}));

describe("circuit breaker (gateway)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("opens circuit after 5 consecutive failures", async () => {
    const { gatewayFetch, getGatewayHealth } = await import("@/lib/api/gateway");
    const failFetcher = vi.fn().mockRejectedValue(new Error("upstream down"));

    // Fire 5 failures
    for (let i = 0; i < 5; i++) {
      await gatewayFetch("test-source", failFetcher);
    }

    const health = getGatewayHealth();
    const source = health.find((h) => h.sourceId === "test-source");
    expect(source).toBeDefined();
    expect(source!.isOpen).toBe(true);
    expect(source!.failures).toBeGreaterThanOrEqual(5);
  });

  it("enters half-open state after cooldown expires", async () => {
    const { gatewayFetch } = await import("@/lib/api/gateway");
    const failFetcher = vi.fn().mockRejectedValue(new Error("fail"));
    const successFetcher = vi.fn().mockResolvedValue({ ok: true });

    // Open the circuit
    for (let i = 0; i < 5; i++) {
      await gatewayFetch("halfopen-src", failFetcher);
    }

    // Simulate cooldown by manipulating time
    vi.useFakeTimers();
    vi.advanceTimersByTime(61_000); // > 60s CIRCUIT_RESET_MS

    // Next call should attempt (half-open), and succeed
    const result = await gatewayFetch("halfopen-src", successFetcher);
    expect(result).toEqual({ ok: true });
    expect(successFetcher).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("resets failures on successful recovery", async () => {
    const { gatewayFetch, getGatewayHealth } = await import("@/lib/api/gateway");

    // Cause 3 failures (not enough to open)
    const failFetcher = vi.fn().mockRejectedValue(new Error("fail"));
    for (let i = 0; i < 3; i++) {
      await gatewayFetch("recover-src", failFetcher);
    }

    // Succeed
    const successFetcher = vi.fn().mockResolvedValue("ok");
    await gatewayFetch("recover-src", successFetcher);

    const health = getGatewayHealth();
    const source = health.find((h) => h.sourceId === "recover-src");
    expect(source!.failures).toBe(0);
  });

  it("calls persistToRedis on state change (first failure)", async () => {
    const { gatewayFetch } = await import("@/lib/api/gateway");
    const failFetcher = vi.fn().mockRejectedValue(new Error("fail"));

    await gatewayFetch("persist-src", failFetcher);

    // persistToRedis is fire-and-forget, called with circuit:sourceId
    expect(mockRedis.set).toHaveBeenCalledWith(
      "circuit:persist-src",
      expect.objectContaining({ failures: 1 }),
      expect.objectContaining({ ex: expect.any(Number) })
    );
  });

  it("restores state from Redis on cold start", async () => {
    // Pre-populate Redis with an open circuit
    mockRedis.get.mockResolvedValueOnce({
      failures: 5,
      lastFailure: Date.now(),
      isOpen: true,
    });

    const { gatewayFetch } = await import("@/lib/api/gateway");
    const fetcher = vi.fn().mockResolvedValue("data");

    // Should return fallback because circuit is open
    const result = await gatewayFetch("restored-src", fetcher, { fallback: "fallback-data" });

    expect(mockRedis.get).toHaveBeenCalledWith("circuit:restored-src");
    expect(result).toBe("fallback-data");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
