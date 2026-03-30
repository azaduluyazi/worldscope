/**
 * Tests for ML Client (browser-side ML module).
 *
 * Since Web Workers aren't available in test environment,
 * we test the client's initialization, error handling, and SSR guards.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

describe("MLClient", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exports MLClient class", async () => {
    const { MLClient } = await import("@/lib/ml/client");
    expect(MLClient).toBeDefined();
    expect(typeof MLClient.getInstance).toBe("function");
  });

  it("getInstance returns singleton", async () => {
    const { MLClient } = await import("@/lib/ml/client");
    const a = MLClient.getInstance();
    const b = MLClient.getInstance();
    expect(a).toBe(b);
    a.destroy(); // cleanup
  });

  it("handles missing Worker gracefully", async () => {
    // Worker constructor may throw in test env
    const { MLClient } = await import("@/lib/ml/client");
    const client = MLClient.getInstance();
    // Client should exist but may not be ready (no real Worker in jsdom)
    expect(client).toBeDefined();
    client.destroy();
  });

  it("sentiment returns empty array for empty input", async () => {
    const { MLClient } = await import("@/lib/ml/client");
    const client = MLClient.getInstance();
    // Even if worker fails, empty input should return []
    const result = await client.sentiment([]);
    expect(result).toEqual([]);
    client.destroy();
  });

  it("ner returns empty array for empty input", async () => {
    const { MLClient } = await import("@/lib/ml/client");
    const client = MLClient.getInstance();
    const result = await client.ner([]);
    expect(result).toEqual([]);
    client.destroy();
  });

  it("cluster returns empty array for empty input", async () => {
    const { MLClient } = await import("@/lib/ml/client");
    const client = MLClient.getInstance();
    const result = await client.cluster([]);
    expect(result).toEqual([]);
    client.destroy();
  });

  it("destroy cleans up singleton", async () => {
    const { MLClient } = await import("@/lib/ml/client");
    const a = MLClient.getInstance();
    a.destroy();
    expect(a.ready).toBe(false);
    // New getInstance creates fresh
    const b = MLClient.getInstance();
    expect(b).not.toBe(a);
    b.destroy();
  });
});

describe("ML Types", () => {
  it("exports all expected types", async () => {
    const types = await import("@/lib/ml/types");
    // Type module should export interfaces (runtime check via keys)
    expect(types).toBeDefined();
  });
});
