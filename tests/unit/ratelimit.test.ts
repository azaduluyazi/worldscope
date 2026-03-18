import { describe, it, expect } from "vitest";
import { getTierForPath, getClientId } from "@/lib/ratelimit";

describe("getTierForPath", () => {
  it("returns 'ai' for AI endpoints", () => {
    expect(getTierForPath("/api/ai/brief")).toBe("ai");
    expect(getTierForPath("/api/ai/report")).toBe("ai");
  });

  it("returns 'strict' for data-heavy endpoints", () => {
    expect(getTierForPath("/api/intel")).toBe("strict");
    expect(getTierForPath("/api/intel/stream")).toBe("strict");
    expect(getTierForPath("/api/market")).toBe("strict");
    expect(getTierForPath("/api/threat")).toBe("strict");
  });

  it("returns 'standard' for normal APIs", () => {
    expect(getTierForPath("/api/feeds")).toBe("standard");
    expect(getTierForPath("/api/feeds/health")).toBe("standard");
    expect(getTierForPath("/api/analytics/feeds")).toBe("standard");
    expect(getTierForPath("/api/errors")).toBe("standard");
  });

  it("returns 'relaxed' for lightweight endpoints", () => {
    expect(getTierForPath("/api/health")).toBe("relaxed");
    expect(getTierForPath("/api/locale")).toBe("relaxed");
    expect(getTierForPath("/api/vitals")).toBe("relaxed");
  });

  it("returns null for cron routes (they use Bearer auth)", () => {
    expect(getTierForPath("/api/cron/fetch-feeds")).toBeNull();
    expect(getTierForPath("/api/cron/validate-feeds")).toBeNull();
    expect(getTierForPath("/api/cron/generate-reports")).toBeNull();
  });

  it("returns null for OG image routes", () => {
    expect(getTierForPath("/api/og/report")).toBeNull();
  });

  it("returns 'standard' as default for unknown API routes", () => {
    expect(getTierForPath("/api/unknown")).toBe("standard");
    expect(getTierForPath("/api/new-feature")).toBe("standard");
  });
});

describe("getClientId", () => {
  it("extracts IP from X-Forwarded-For header", () => {
    const req = new Request("http://localhost", {
      headers: { "X-Forwarded-For": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientId(req)).toBe("1.2.3.4");
  });

  it("extracts IP from X-Real-IP header", () => {
    const req = new Request("http://localhost", {
      headers: { "X-Real-IP": "10.0.0.1" },
    });
    expect(getClientId(req)).toBe("10.0.0.1");
  });

  it("prefers X-Forwarded-For over X-Real-IP", () => {
    const req = new Request("http://localhost", {
      headers: {
        "X-Forwarded-For": "1.2.3.4",
        "X-Real-IP": "10.0.0.1",
      },
    });
    expect(getClientId(req)).toBe("1.2.3.4");
  });

  it("falls back to 'anonymous' when no IP headers", () => {
    const req = new Request("http://localhost");
    expect(getClientId(req)).toBe("anonymous");
  });
});
