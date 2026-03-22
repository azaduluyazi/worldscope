"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getThemeById, type DashboardTheme, THEMES, DEFAULT_THEME } from "@/config/themes";

interface ThemeContextType {
  theme: DashboardTheme;
  themeId: string;
  setTheme: (id: string) => void;
  themes: DashboardTheme[];
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_THEME,
  themeId: DEFAULT_THEME.id,
  setTheme: () => {},
  themes: THEMES,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME.id);
  const [theme, setThemeObj] = useState(DEFAULT_THEME);

  useEffect(() => {
    const saved = localStorage.getItem("worldscope-theme");
    if (saved) {
      const t = getThemeById(saved);
      setThemeId(t.id);
      setThemeObj(t);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const c = theme.colors;

    root.style.setProperty("--color-hud-base", c.base);
    root.style.setProperty("--color-hud-surface", c.surface);
    root.style.setProperty("--color-hud-panel", c.panel);
    root.style.setProperty("--color-hud-border", c.border);
    root.style.setProperty("--color-hud-muted", c.muted);
    root.style.setProperty("--color-hud-text", c.text);
    root.style.setProperty("--color-hud-accent", c.accent);
    root.style.setProperty("--background", c.base);
    root.style.setProperty("--foreground", c.text);
    root.style.setProperty("--card", c.panel);
    root.style.setProperty("--primary", c.accent);

    if (theme.glow) root.style.setProperty("--color-hud-glow", theme.glow);

    const scanlines = document.querySelector(".scanlines") as HTMLElement;
    if (scanlines) scanlines.style.display = theme.scanlines ? "block" : "none";

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", c.base);
  }, [theme]);

  const handleSetTheme = useCallback((id: string) => {
    const t = getThemeById(id);
    setThemeId(t.id);
    setThemeObj(t);
    localStorage.setItem("worldscope-theme", t.id);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, themeId, setTheme: handleSetTheme, themes: THEMES }}>
      <div className="dark">{children}</div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
