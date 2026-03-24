import { describe, it, expect } from "vitest";
import { z } from "zod";

const intelQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(2000).default(100),
  hours: z.coerce.number().min(1).max(720).default(24),
  lang: z.string().min(2).max(5).default("en"),
  category: z.string().optional(),
  severity: z.string().optional(),
});

describe("API input validation", () => {
  it("accepts valid intel query params", () => {
    const result = intelQuerySchema.safeParse({ limit: "50", hours: "24", lang: "en" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.hours).toBe(24);
    }
  });

  it("rejects limit > 2000", () => {
    const result = intelQuerySchema.safeParse({ limit: "5000" });
    expect(result.success).toBe(false);
  });

  it("rejects negative hours", () => {
    const result = intelQuerySchema.safeParse({ hours: "-1" });
    expect(result.success).toBe(false);
  });

  it("applies defaults for missing params", () => {
    const result = intelQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(100);
      expect(result.data.hours).toBe(24);
      expect(result.data.lang).toBe("en");
    }
  });
});
