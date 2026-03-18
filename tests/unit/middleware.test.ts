import { describe, it, expect } from "vitest";
import { getTierForPath } from "@/lib/ratelimit";

describe("middleware route matching", () => {
  const publicApiRoutes = [
    "/api/intel",
    "/api/market",
    "/api/threat",
    "/api/feeds",
    "/api/feeds/health",
    "/api/ai/brief",
    "/api/ai/report",
    "/api/analytics/feeds",
    "/api/health",
    "/api/errors",
    "/api/locale",
    "/api/vitals",
  ];

  const cronRoutes = [
    "/api/cron/fetch-feeds",
    "/api/cron/validate-feeds",
    "/api/cron/generate-reports",
  ];

  it("all public API routes have a rate limit tier", () => {
    for (const route of publicApiRoutes) {
      const tier = getTierForPath(route);
      expect(tier, `Route ${route} should have a rate limit tier`).not.toBeNull();
      expect(["ai", "strict", "standard", "relaxed"]).toContain(tier);
    }
  });

  it("cron routes are excluded from rate limiting", () => {
    for (const route of cronRoutes) {
      expect(getTierForPath(route), `Cron route ${route} should not be rate limited`).toBeNull();
    }
  });

  it("AI routes get the strictest tier", () => {
    expect(getTierForPath("/api/ai/brief")).toBe("ai");
    expect(getTierForPath("/api/ai/report")).toBe("ai");
  });

  it("rate limit tiers are ordered by strictness", () => {
    // Verify the hierarchy: ai < strict < standard < relaxed
    const tierOrder = { ai: 0, strict: 1, standard: 2, relaxed: 3 };

    const aiTier = getTierForPath("/api/ai/brief")!;
    const strictTier = getTierForPath("/api/intel")!;
    const standardTier = getTierForPath("/api/feeds")!;
    const relaxedTier = getTierForPath("/api/health")!;

    expect(tierOrder[aiTier]).toBeLessThan(tierOrder[strictTier]);
    expect(tierOrder[strictTier]).toBeLessThan(tierOrder[standardTier]);
    expect(tierOrder[standardTier]).toBeLessThan(tierOrder[relaxedTier]);
  });
});
