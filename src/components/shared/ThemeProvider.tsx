"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { getThemeById, type DashboardTheme, THEMES, DEFAULT_THEME } from "@/config/themes";

/** Locales that require right-to-left layout */
const RTL_LOCALES = ["ar", "fa"];

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

// All known effect class names
const EFFECT_CLASSES = [
  "effect-glassmorphism", "effect-phosphor-glow", "effect-broadcast-bar", "effect-alert-mode",
  "effect-neon-cyberpunk", "effect-bloomberg-terminal", "effect-warzone",
];
const CARD_RADIUS_MAP = { none: "0px", sm: "4px", md: "8px", lg: "12px" };

/** Apply theme CSS variables to document root */
function applyThemeToDOM(theme: DashboardTheme) {
  const root = document.documentElement;
  const c = theme.colors;

  // Core color variables — write the *short* names (`--hud-base`, …)
  // because globals.css threads them through `@theme inline` via
  // `--color-hud-base: var(--hud-base, <default>)`. Writing the long
  // `--color-hud-*` names used to be a no-op for Tailwind utilities
  // under `@theme inline` (see sorunlar/theme-not-applying).
  root.style.setProperty("--hud-base", c.base);
  root.style.setProperty("--hud-surface", c.surface);
  root.style.setProperty("--hud-panel", c.panel);
  root.style.setProperty("--hud-border", c.border);
  root.style.setProperty("--hud-muted", c.muted);
  root.style.setProperty("--hud-text", c.text);
  root.style.setProperty("--hud-accent", c.accent);
  // shadcn tokens (--background, --foreground, …) are plain `:root`
  // variables (not behind @theme inline), so direct override works.
  root.style.setProperty("--background", c.base);
  root.style.setProperty("--foreground", c.text);
  root.style.setProperty("--card", c.panel);
  root.style.setProperty("--primary", c.accent);
  root.style.setProperty("--border", c.border);
  root.style.setProperty("--muted", c.muted);
  root.style.setProperty("--muted-foreground", c.muted);
  root.style.setProperty("--input", c.border);

  if (theme.glow) root.style.setProperty("--hud-glow", theme.glow);

  // Secondary accent (neon cyan, warzone orange, etc.)
  if (theme.colors.accent2) {
    root.style.setProperty("--hud-accent2", theme.colors.accent2);
  }

  // Custom severity color overrides
  if (theme.severityColors) {
    const sc = theme.severityColors;
    if (sc.critical) root.style.setProperty("--severity-critical", sc.critical);
    if (sc.high) root.style.setProperty("--severity-high", sc.high);
    if (sc.medium) root.style.setProperty("--severity-medium", sc.medium);
    if (sc.low) root.style.setProperty("--severity-low", sc.low);
    if (sc.info) root.style.setProperty("--severity-info", sc.info);
  }

  // Card radius
  const radius = CARD_RADIUS_MAP[theme.cardRadius || "none"];
  root.style.setProperty("--card-radius", radius);

  // Font mode (mono | sans | serif)
  root.dataset.fontMode = theme.fontMode || "mono";

  // Display font (orbitron | rajdhani | share-tech-mono)
  if (theme.displayFont) {
    root.dataset.displayFont = theme.displayFont;
  } else {
    delete root.dataset.displayFont;
  }

  // Light mode toggle
  if (theme.lightMode) {
    root.classList.add("light-theme");
    root.classList.remove("dark");
  } else {
    root.classList.remove("light-theme");
    root.classList.add("dark");
  }

  // Toggle scanlines CRT overlay
  const scanlines = document.querySelector(".scanlines") as HTMLElement;
  if (scanlines) scanlines.style.display = theme.scanlines ? "block" : "none";

  // Effect classes — remove all, then add current
  EFFECT_CLASSES.forEach((cls) => root.classList.remove(cls));
  if (theme.effect) root.classList.add(`effect-${theme.effect}`);

  // Card shadow mode
  root.dataset.cardShadow = theme.cardShadow || "none";

  // Update mobile status bar color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", c.base);

  // Set data attribute for variant-specific styling
  root.dataset.theme = theme.id;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  let currentLocale = "en";
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    currentLocale = useLocale();
  } catch {
    // useLocale may throw if no IntlProvider is mounted yet — fall back to "en"
  }

  // IMPORTANT: useState initializers must be identical on server and client
  // to avoid React hydration error #418. Previously we read localStorage
  // during the initializer, which returned the user's saved theme on the
  // client but DEFAULT_THEME on the server — causing every downstream
  // `theme.*` expression (e.g. NeonBreakingBanner conditional render,
  // DefconBar visibility, className flips) to produce different HTML on
  // the two sides. We now start with defaults on both, then hydrate the
  // saved theme inside the post-mount effect below.
  const [themeId, setThemeId] = useState(DEFAULT_THEME.id);
  const [theme, setThemeObj] = useState<DashboardTheme>(DEFAULT_THEME);
  const isInitial = useRef(true);

  // Apply theme on mount (handles hydration) and on changes
  useEffect(() => {
    if (isInitial.current) {
      // On first mount, read localStorage and apply immediately.
      // This is the single cascading render that hydrates the real theme.
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
  }, [theme, themeId]);

  // RTL auto-detection based on locale
  useEffect(() => {
    const isRTL = RTL_LOCALES.includes(currentLocale);
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = currentLocale;
  }, [currentLocale]);

  const handleSetTheme = useCallback((id: string) => {
    const t = getThemeById(id);
    setThemeId(t.id);
    setThemeObj(t);
    localStorage.setItem("worldscope-theme", t.id);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, themeId, setTheme: handleSetTheme, themes: THEMES }}>
      <div className={theme.lightMode ? "light-theme" : "dark"}>{children}</div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
