import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateEnv } from "@/lib/env";

describe("validateEnv", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns valid=false when required vars missing", () => {
    const result = validateEnv();
    expect(result.valid).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it("returns valid=true when required vars present", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-key");
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "pk.test");

    const result = validateEnv();
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("lists optional vars as warnings when missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-key");
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "pk.test");

    const result = validateEnv();
    expect(result.warnings.length).toBeGreaterThan(0);
    // GROQ_API_KEY is optional
    expect(result.warnings.some((w) => w.includes("GROQ_API_KEY"))).toBe(true);
  });

  it("counts configured vars correctly", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-key");
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "pk.test");
    vi.stubEnv("GROQ_API_KEY", "gsk_test");

    const result = validateEnv();
    expect(result.configured).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(result.configured).toContain("GROQ_API_KEY");
    expect(result.configured.length).toBe(4);
  });
});
