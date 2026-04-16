/**
 * Unit tests for the pure parts of entities.ts.
 * DB-touching functions (upsertEntity, linkEntitiesToEvent, etc.) are
 * covered by integration tests that run against a real Supabase instance
 * in CI with the service role key — not here.
 */
import { describe, it, expect } from "vitest";
import { slugify } from "../entities";

describe("slugify", () => {
  it("handles basic English names", () => {
    expect(slugify("White House")).toBe("white-house");
    expect(slugify("NATO")).toBe("nato");
    expect(slugify("United States")).toBe("united-states");
  });

  it("handles Turkish characters", () => {
    expect(slugify("Türkiye")).toBe("turkiye");
    expect(slugify("İstanbul")).toBe("istanbul");
    expect(slugify("Erdoğan")).toBe("erdogan");
    expect(slugify("Güneydoğu")).toBe("guneydogu");
  });

  it("strips diacritics and special chars", () => {
    expect(slugify("Zélensky")).toBe("zelensky");
    expect(slugify("São Paulo")).toBe("sao-paulo");
    expect(slugify("H&M")).toBe("hm");
  });

  it("collapses multiple spaces", () => {
    expect(slugify("  New   York  ")).toBe("new-york");
  });

  it("returns empty string for entities with no slug-able chars", () => {
    expect(slugify("...")).toBe("");
    expect(slugify("   ")).toBe("");
  });
});
