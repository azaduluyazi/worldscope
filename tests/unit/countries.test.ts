import { describe, it, expect } from "vitest";
import { COUNTRIES, COUNTRY_MAP, REGIONS } from "@/config/countries";

describe("COUNTRIES config", () => {
  it("has 37 countries", () => {
    expect(COUNTRIES.length).toBe(37);
  });

  it("all country codes are unique 2-letter uppercase", () => {
    const codes = COUNTRIES.map((c) => c.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
    codes.forEach((code) => {
      expect(code).toMatch(/^[A-Z]{2}$/);
    });
  });

  it("all countries have valid coordinates", () => {
    for (const c of COUNTRIES) {
      expect(c.lat).toBeGreaterThanOrEqual(-90);
      expect(c.lat).toBeLessThanOrEqual(90);
      expect(c.lng).toBeGreaterThanOrEqual(-180);
      expect(c.lng).toBeLessThanOrEqual(180);
      expect(c.zoom).toBeGreaterThan(0);
    }
  });

  it("all countries have both English and Turkish names", () => {
    for (const c of COUNTRIES) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.nameTr.length).toBeGreaterThan(0);
    }
  });

  it("all countries belong to a known region", () => {
    for (const c of COUNTRIES) {
      expect(REGIONS).toContain(c.region);
    }
  });
});

describe("COUNTRY_MAP", () => {
  it("provides O(1) lookup by uppercase code", () => {
    expect(COUNTRY_MAP.get("TR")?.name).toBe("Turkey");
    expect(COUNTRY_MAP.get("US")?.name).toBe("United States");
    expect(COUNTRY_MAP.get("JP")?.name).toBe("Japan");
  });

  it("returns undefined for non-existent code", () => {
    expect(COUNTRY_MAP.get("xx")).toBeUndefined();
  });

  it("has same count as COUNTRIES array", () => {
    expect(COUNTRY_MAP.size).toBe(COUNTRIES.length);
  });
});

describe("REGIONS", () => {
  it("has expected regions", () => {
    expect(REGIONS).toContain("Middle East");
    expect(REGIONS).toContain("Europe");
    expect(REGIONS).toContain("Asia");
    expect(REGIONS).toContain("Americas");
    expect(REGIONS).toContain("Africa");
  });

  it("every region has at least one country", () => {
    for (const region of REGIONS) {
      const count = COUNTRIES.filter((c) => c.region === region).length;
      expect(count).toBeGreaterThan(0);
    }
  });
});
