/**
 * Dashboard Theme System — 2 themes only.
 *
 * Previously had 16 themes. Reduced to 2 after A2 redesign session
 * (2026-04-20) — see wiki log for motivation. Users whose localStorage
 * held removed theme IDs (spartan-red, warzone, amber, bloomberg, etc.)
 * will automatically fall back to DEFAULT_THEME via getThemeById().
 */

export interface DashboardTheme {
  id: string;
  name: string;
  icon: string;
  description: string;
  group: "mythology";
  colors: {
    base: string;
    surface: string;
    panel: string;
    border: string;
    muted: string;
    text: string;
    accent: string;
    /** Optional secondary accent */
    accent2?: string;
  };
  glow?: string;
  scanlines?: boolean;
  fontMode?: "mono" | "sans" | "serif";
  /** Display font for headers — maps to CSS --font-display */
  displayFont?: "orbitron" | "rajdhani" | "share-tech-mono";
  cardRadius?: "none" | "sm" | "md" | "lg";
  cardShadow?: "none" | "sm" | "md" | "glow";
  effect?: string;
  lightMode?: boolean;
  /** Custom severity color overrides for this theme */
  severityColors?: {
    critical?: string;
    high?: string;
    medium?: string;
    low?: string;
    info?: string;
  };
  /** Whether to show a DEFCON / threat-level bar */
  defconBar?: boolean;
  /** Whether top header is a gradient critical banner */
  gradientBanner?: boolean;
  /** Grid overlay CSS (e.g. subtle dotted grid) */
  gridOverlay?: string;
}

export const THEMES: DashboardTheme[] = [
  {
    id: "warroom",
    name: "Troia War Room",
    icon: "🐴",
    description: "Amber command center · CRT scanlines · Pantheon nav",
    group: "mythology",
    colors: {
      base: "#060509",
      surface: "#0a0810",
      panel: "#110d14",
      border: "#2d1e08",
      muted: "#7e7866",
      text: "#f1ede3",
      accent: "#f5a524",
      accent2: "#6effb8",
    },
    glow: "#f5a524",
    scanlines: true,
    fontMode: "mono",
    cardRadius: "none",
    cardShadow: "glow",
    effect: "warzone",
    defconBar: true,
    gradientBanner: true,
    severityColors: {
      critical: "#ff3b30",
      high: "#ff9500",
      medium: "#f5a524",
      low: "#6effb8",
      info: "#c5bfae",
    },
  },
  {
    id: "cyberpunk",
    name: "Neon Cyberpunk",
    icon: "⚡",
    description: "Magenta + cyan + violet · Orbitron · screen-blend CRT",
    group: "mythology",
    colors: {
      base: "#06011a",
      surface: "#0a0230",
      panel: "#120340",
      border: "#3d0a56",
      muted: "#6a7a99",
      text: "#eaf8ff",
      accent: "#ff2bd6",
      accent2: "#00f0ff",
    },
    glow: "#ff2bd6",
    scanlines: true,
    fontMode: "mono",
    displayFont: "orbitron",
    cardRadius: "none",
    cardShadow: "glow",
    effect: "neon-cyberpunk",
    defconBar: true,
    gradientBanner: true,
    severityColors: {
      critical: "#ff004d",
      high: "#ffb300",
      medium: "#ff2bd6",
      low: "#00f0ff",
      info: "#a7c5e8",
    },
  },
];

export const DEFAULT_THEME =
  THEMES.find((t) => t.id === "warroom") || THEMES[0];

export const THEME_GROUPS: Record<string, string> = {
  mythology: "Troia Themes",
};

export function getThemeById(id: string): DashboardTheme {
  return THEMES.find((t) => t.id === id) || DEFAULT_THEME;
}
