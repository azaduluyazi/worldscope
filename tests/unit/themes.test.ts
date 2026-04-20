import { describe, it, expect } from "vitest";
import { THEMES, getThemeById, DEFAULT_THEME, THEME_GROUPS } from "@/config/themes";

describe("Theme system", () => {
  it("has exactly 2 themes (warroom + cyberpunk)", () => {
    expect(THEMES.length).toBe(2);
    const ids = THEMES.map((t) => t.id).sort();
    expect(ids).toEqual(["cyberpunk", "warroom"]);
  });

  it("every theme has required color properties", () => {
    for (const theme of THEMES) {
      expect(theme.colors.base).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.colors.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.colors.text).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.id).toBeTruthy();
      expect(theme.name).toBeTruthy();
    }
  });

  it("getThemeById returns correct theme for known ids", () => {
    expect(getThemeById("warroom").id).toBe("warroom");
    expect(getThemeById("cyberpunk").id).toBe("cyberpunk");
  });

  it("getThemeById falls back to default for legacy/unknown ids", () => {
    // Previously valid IDs — all should gracefully fall back to warroom
    // so existing users with a removed theme in localStorage don't break.
    expect(getThemeById("bloomberg").id).toBe(DEFAULT_THEME.id);
    expect(getThemeById("warzone").id).toBe(DEFAULT_THEME.id);
    expect(getThemeById("spartan-red").id).toBe(DEFAULT_THEME.id);
    expect(getThemeById("nonexistent").id).toBe(DEFAULT_THEME.id);
  });

  it("DEFAULT_THEME is warroom", () => {
    expect(DEFAULT_THEME.id).toBe("warroom");
  });

  it("no duplicate theme IDs", () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all groups are valid", () => {
    const validGroups = Object.keys(THEME_GROUPS);
    for (const theme of THEMES) {
      expect(validGroups).toContain(theme.group);
    }
  });

  it("warroom has defconBar + gradientBanner enabled", () => {
    const t = getThemeById("warroom");
    expect(t.defconBar).toBe(true);
    expect(t.gradientBanner).toBe(true);
  });

  it("cyberpunk has defconBar + gradientBanner enabled", () => {
    const t = getThemeById("cyberpunk");
    expect(t.defconBar).toBe(true);
    expect(t.gradientBanner).toBe(true);
  });

  it("no light themes remain", () => {
    const lightThemes = THEMES.filter((t) => t.lightMode);
    expect(lightThemes.length).toBe(0);
  });
});
