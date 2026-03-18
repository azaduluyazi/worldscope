import { describe, it, expect } from "vitest";
import { locales, defaultLocale } from "@/i18n/config";
import en from "@/i18n/en.json";
import tr from "@/i18n/tr.json";

describe("i18n config", () => {
  it("supports 10 locales", () => {
    expect(locales).toContain("en");
    expect(locales).toContain("tr");
    expect(locales.length).toBeGreaterThanOrEqual(10);
  });

  it("default locale is en", () => {
    expect(defaultLocale).toBe("en");
  });
});

describe("translation completeness", () => {
  /** Recursively extract all keys from a nested object */
  function extractKeys(obj: Record<string, unknown>, prefix = ""): string[] {
    const keys: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        keys.push(...extractKeys(value as Record<string, unknown>, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys.sort();
  }

  const enKeys = extractKeys(en);
  const trKeys = extractKeys(tr);

  it("en.json and tr.json have the same keys", () => {
    expect(enKeys).toEqual(trKeys);
  });

  it("no empty values in en.json", () => {
    for (const key of enKeys) {
      const value = key.split(".").reduce((obj: Record<string, unknown>, k) => obj[k] as Record<string, unknown>, en as Record<string, unknown>);
      expect(value, `en.json key "${key}" is empty`).toBeTruthy();
    }
  });

  it("no empty values in tr.json", () => {
    for (const key of trKeys) {
      const value = key.split(".").reduce((obj: Record<string, unknown>, k) => obj[k] as Record<string, unknown>, tr as Record<string, unknown>);
      expect(value, `tr.json key "${key}" is empty`).toBeTruthy();
    }
  });

  it("has required translation namespaces", () => {
    const requiredNamespaces = ["app", "variants", "intel", "threat", "ai", "sidebar", "mobile", "alerts", "analysis", "locale"];
    for (const ns of requiredNamespaces) {
      expect(en, `en.json missing namespace "${ns}"`).toHaveProperty(ns);
      expect(tr, `tr.json missing namespace "${ns}"`).toHaveProperty(ns);
    }
  });

  it("has at least 40 translation keys per locale", () => {
    expect(enKeys.length).toBeGreaterThanOrEqual(40);
    expect(trKeys.length).toBeGreaterThanOrEqual(40);
  });

  it("interpolation placeholders match between locales", () => {
    const placeholderRegex = /\{(\w+)\}/g;

    for (const key of enKeys) {
      const enValue = key.split(".").reduce((obj: Record<string, unknown>, k) => obj[k] as Record<string, unknown>, en as Record<string, unknown>) as unknown as string;
      const trValue = key.split(".").reduce((obj: Record<string, unknown>, k) => obj[k] as Record<string, unknown>, tr as Record<string, unknown>) as unknown as string;

      if (typeof enValue !== "string" || typeof trValue !== "string") continue;

      const enPlaceholders = [...enValue.matchAll(placeholderRegex)].map(m => m[1]).sort();
      const trPlaceholders = [...trValue.matchAll(placeholderRegex)].map(m => m[1]).sort();

      expect(trPlaceholders, `Placeholder mismatch for key "${key}": EN has {${enPlaceholders.join(",")}} but TR has {${trPlaceholders.join(",")}}`).toEqual(enPlaceholders);
    }
  });
});
