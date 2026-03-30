import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPipeline = {
  set: vi.fn().mockReturnThis(),
  exec: vi.fn().mockResolvedValue([]),
};

const mockRedis = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue("OK"),
  del: vi.fn().mockResolvedValue(1),
  pipeline: vi.fn(() => mockPipeline),
};

vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor() {}
    get = mockRedis.get;
    set = mockRedis.set;
    del = mockRedis.del;
    pipeline = mockRedis.pipeline;
  },
}));

describe("seedPublish", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("writes data AND seed-meta via Redis pipeline", async () => {
    const { seedPublish } = await import("@/lib/seed/seed-utils");
    const meta = await seedPublish("seed:test", [1, 2, 3], 300, "test-seed");

    expect(mockRedis.pipeline).toHaveBeenCalled();
    expect(mockPipeline.set).toHaveBeenCalledTimes(2);

    // First call: data key with TTL
    expect(mockPipeline.set).toHaveBeenNthCalledWith(
      1, "seed:test", [1, 2, 3], { ex: 300 }
    );
    // Second call: meta key with 2x TTL
    expect(mockPipeline.set).toHaveBeenNthCalledWith(
      2, "seed-meta:seed:test", expect.objectContaining({
        recordCount: 3,
        ttl: 300,
        source: "test-seed",
      }), { ex: 600 }
    );
    expect(mockPipeline.exec).toHaveBeenCalled();
    expect(meta.recordCount).toBe(3);
    expect(meta.source).toBe("test-seed");
  });
});

describe("seedMeta", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns freshness info from seed-meta key", async () => {
    const fakeMeta = {
      fetchedAt: new Date().toISOString(),
      recordCount: 10,
      ttl: 600,
      source: "seed-market",
    };
    mockRedis.get.mockResolvedValueOnce(fakeMeta);

    const { seedMeta } = await import("@/lib/seed/seed-utils");
    const result = await seedMeta("seed:market:quotes");

    expect(mockRedis.get).toHaveBeenCalledWith("seed-meta:seed:market:quotes");
    expect(result).toEqual(fakeMeta);
  });
});

describe("acquireSeedLock / releaseSeedLock", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns true on first call (lock acquired)", async () => {
    mockRedis.set.mockResolvedValueOnce("OK");
    const { acquireSeedLock } = await import("@/lib/seed/seed-utils");
    const result = await acquireSeedLock("test-seed");
    expect(result).toBe(true);
    expect(mockRedis.set).toHaveBeenCalledWith(
      "seed-lock:test-seed", "1", expect.objectContaining({ nx: true })
    );
  });

  it("returns false when lock is already held", async () => {
    mockRedis.set.mockResolvedValueOnce(null);
    const { acquireSeedLock } = await import("@/lib/seed/seed-utils");
    const result = await acquireSeedLock("test-seed");
    expect(result).toBe(false);
  });

  it("deletes the lock key on release", async () => {
    const { releaseSeedLock } = await import("@/lib/seed/seed-utils");
    await releaseSeedLock("test-seed");
    expect(mockRedis.del).toHaveBeenCalledWith("seed-lock:test-seed");
  });
});

describe("runSeeder", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("skips when lock is held", async () => {
    mockRedis.set.mockResolvedValueOnce(null); // lock NOT acquired
    const { runSeeder } = await import("@/lib/seed/seed-utils");
    const fn = vi.fn();
    const result = await runSeeder("test-seed", 30_000, fn);

    expect(result.skipped).toBe(true);
    expect(fn).not.toHaveBeenCalled();
  });
});
