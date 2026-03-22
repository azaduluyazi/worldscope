"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
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

/** Apply theme CSS variables to document root */
function applyThemeToDOM(theme: DashboardTheme) {
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
  root.style.setProperty("--border", c.border);
  root.style.setProperty("--muted", c.muted);
  root.style.setProperty("--muted-foreground", c.muted);
  root.style.setProperty("--input", c.border);

  if (theme.glow) root.style.setProperty("--color-hud-glow", theme.glow);

  // Toggle scanlines CRT overlay
  const scanlines = document.querySelector(".scanlines") as HTMLElement;
  if (scanlines) scanlines.style.display = theme.scanlines ? "block" : "none";

  // Update mobile status bar color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", c.base);

  // Set data attribute for variant-specific styling
  root.dataset.theme = theme.id;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(() => {
    // SSR-safe: try to read from localStorage synchronously on client
    if (typeof window !== "undefined") {
      return localStorage.getItem("worldscope-theme") || DEFAULT_THEME.id;
    }
    return DEFAULT_THEME.id;
  });
  const [theme, setThemeObj] = useState(() => getThemeById(themeId));
  const isInitial = useRef(true);

  // Apply theme on mount (handles hydration) and on changes
  useEffect(() => {
    if (isInitial.current) {
      // On first mount, read localStorage and apply immediately
      const saved = localStorage.getItem("worldscope-theme");
      if (saved && saved !== themeId) {
        const t = getThemeById(saved);
        setThemeId(t.id);
        setThemeObj(t);
        applyThemeToDOM(t);
      } else {
        applyThemeToDOM(theme);
      }
      isInitial.current = false;
    } else {
      applyThemeToDOM(theme);
    }
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
