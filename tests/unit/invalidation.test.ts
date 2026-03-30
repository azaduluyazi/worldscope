import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPipeline = {
  del: vi.fn().mockReturnThis(),
  exec: vi.fn().mockResolvedValue([]),
};

const mockRedis = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue("OK"),
  scan: vi.fn().mockResolvedValue([0, []]),
  pipeline: vi.fn(() => mockPipeline),
};

vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor() {}
    get = mockRedis.get;
    set = mockRedis.set;
    scan = mockRedis.scan;
    pipeline = mockRedis.pipeline;
  },
}));

describe("invalidateGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Return keys on first scan, then 0 cursor (done)
    mockRedis.scan.mockResolvedValue([0, []]);
  });

  it("scans keys with correct prefixes for market group", async () => {
    mockRedis.scan
      .mockResolvedValueOnce([0, ["seed:market:quotes", "seed:market:indices"]])
      .mockResolvedValueOnce([0, ["market:data"]]);

    const { invalidateGroup } = await import("@/lib/cache/invalidation");
    const result = await invalidateGroup("market");

    // Should scan for both prefixes: seed:market: and market:
    expect(mockRedis.scan).toHaveBeenCalledWith(0, expect.objectContaining({ match: "seed:market:*" }));
    expect(mockRedis.scan).toHaveBeenCalledWith(0, expect.objectContaining({ match: "market:*" }));
    expect(result.deleted).toBe(3);
    expect(result.group).toBe("market");
  });

  it("batch deletes keys via pipeline", async () => {
    mockRedis.scan.mockResolvedValueOnce([0, ["seed:cyber:a", "seed:cyber:b"]]);
    mockRedis.scan.mockResolvedValueOnce([0, ["cyber:x"]]);

    const { invalidateGroup } = await import("@/lib/cache/invalidation");
    await invalidateGroup("cyber");

    expect(mockPipeline.del).toHaveBeenCalledTimes(3);
    expect(mockPipeline.exec).toHaveBeenCalled();
  });

  it('"all" group covers all major prefixes', async () => {
    const { invalidateGroup } = await import("@/lib/cache/invalidation");
    await invalidateGroup("all");

    // "all" should scan for seed:, market:, economic:, cyber:, flights:, etc.
    const scanCalls = mockRedis.scan.mock.calls.map((c) => c[1]?.match);
    expect(scanCalls).toContain("seed:*");
    expect(scanCalls).toContain("market:*");
    expect(scanCalls).toContain("intel:*");
    expect(scanCalls).toContain("cyber:*");
  });
});
