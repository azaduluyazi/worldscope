import { describe, it, expect } from "vitest";
import { truncate, stripHtml } from "@/lib/utils/sanitize";

describe("truncate", () => {
  it("returns full string when under limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });
  it("truncates at word boundary and adds ellipsis", () => {
    const result = truncate("hello world foo bar", 11);
    expect(result.length).toBeLessThanOrEqual(15);
    expect(result).toContain("…");
  });
  it("handles empty string", () => {
    expect(truncate("", 10)).toBe("");
  });
});

describe("stripHtml", () => {
  it("strips HTML tags", () => {
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });
  it("handles string without HTML", () => {
    expect(stripHtml("plain text")).toBe("plain text");
  });
  it("handles empty string", () => {
    expect(stripHtml("")).toBe("");
  });
});
