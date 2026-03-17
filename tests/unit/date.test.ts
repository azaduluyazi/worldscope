import { describe, it, expect, vi, afterEach } from "vitest";
import { timeAgo, formatUTC } from "@/lib/utils/date";

describe("timeAgo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "just now" for very recent dates', () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe("just now");
  });

  it("returns minutes ago for recent dates", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe("5m ago");
  });

  it("returns hours ago", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(threeHoursAgo)).toBe("3h ago");
  });

  it("returns days ago", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(twoDaysAgo)).toBe("2d ago");
  });
});

describe("formatUTC", () => {
  it("formats a date as HH:MM:SS UTC", () => {
    const date = new Date("2026-01-15T14:32:07.000Z");
    expect(formatUTC(date)).toBe("14:32:07 UTC");
  });

  it("returns current time when no argument given", () => {
    const result = formatUTC();
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2} UTC$/);
  });
});
