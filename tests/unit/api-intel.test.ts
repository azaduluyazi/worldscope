import { describe, it, expect } from "vitest";
import { SEVERITY_ORDER } from "@/types/intel";
import type { IntelItem, Severity } from "@/types/intel";

describe("Intel data types", () => {
  it("SEVERITY_ORDER ranks critical lowest (highest priority)", () => {
    expect(SEVERITY_ORDER.critical).toBeLessThan(SEVERITY_ORDER.high);
    expect(SEVERITY_ORDER.high).toBeLessThan(SEVERITY_ORDER.medium);
    expect(SEVERITY_ORDER.medium).toBeLessThan(SEVERITY_ORDER.low);
    expect(SEVERITY_ORDER.low).toBeLessThan(SEVERITY_ORDER.info);
  });

  it("IntelItem validates required fields at type level", () => {
    const item: IntelItem = {
      id: "test-1",
      title: "Test event",
      summary: "Test summary",
      source: "Reuters",
      category: "conflict",
      severity: "high",
      publishedAt: new Date().toISOString(),
      url: "https://example.com",
    };
    expect(item.id).toBeTruthy();
    expect(item.severity).toBe("high");
  });

  it("all severity levels are defined in SEVERITY_ORDER", () => {
    const levels: Severity[] = ["critical", "high", "medium", "low", "info"];
    for (const level of levels) {
      expect(SEVERITY_ORDER[level]).toBeDefined();
    }
  });
});
