import { describe, it, expect } from "vitest";
import { THEMES, getThemeById, DEFAULT_THEME, THEME_GROUPS } from "@/config/themes";

describe("Theme system", () => {
  it("has 21 themes defined", () => {
    expect(THEMES.length).toBe(21);
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

  it("getThemeById returns correct theme", () => {
    expect(getThemeById("cyberpunk").id).toBe("cyberpunk");
    expect(getThemeById("bloomberg").id).toBe("bloomberg");
    expect(getThemeById("warzone").id).toBe("warzone");
  });

  it("getThemeById returns default for unknown id", () => {
    expect(getThemeById("nonexistent").id).toBe(DEFAULT_THEME.id);
  });

  it("no duplicate theme IDs", () => {
    const ids = THEMES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all groups are valid", () => {
    const validGroups = Object.keys(THEME_GROUPS);
    for (const theme of THEMES) {
      expect(validGroups).toContain(theme.group);
    }
  });

  it("warzone has defconBar enabled", () => {
    expect(getThemeById("warzone").defconBar).toBe(true);
  });

  it("cyberpunk has gradientBanner enabled", () => {
    expect(getThemeById("cyberpunk").gradientBanner).toBe(true);
  });

  it("bloomberg has zero card radius and no card shadow", () => {
    const bloomberg = getThemeById("bloomberg");
    expect(bloomberg.cardRadius).toBe("none");
    expect(bloomberg.cardShadow).toBe("none");
  });

  it("light themes have lightMode flag", () => {
    const lightThemes = THEMES.filter(t => t.lightMode);
    expect(lightThemes.length).toBeGreaterThanOrEqual(4);
    for (const t of lightThemes) {
      expect(t.group).toBe("editorial");
    }
  });
});
