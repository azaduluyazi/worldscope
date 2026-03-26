/**
 * Dashboard Theme System — 20 visual themes.
 * Each theme defines CSS custom property overrides + layout/typography hints.
 */

export interface DashboardTheme {
  id: string;
  name: string;
  icon: string;
  description: string;
  group: "tactical" | "ambient" | "terminal" | "broadcast" | "editorial" | "modern";
  colors: {
    base: string;
    surface: string;
    panel: string;
    border: string;
    muted: string;
    text: string;
    accent: string;
    /** Optional secondary accent (e.g. neon cyan alongside neon pink) */
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
  /** Whether the breaking banner uses gradient animation */
  gradientBanner?: boolean;
  /** Custom grid overlay color (rgba) */
  gridOverlay?: string;
}

export const THEMES: DashboardTheme[] = [
  // ══════════════════════════════════════════════════════
  // DARK TACTICAL (1-6) — existing themes
  // ══════════════════════════════════════════════════════

  {
    id: "military",
    name: "Military HUD",
    icon: "🎖️",
    description: "Dark tactical command center",
    group: "tactical",
    colors: {
      base: "#050a12",
      surface: "#080e1a",
      panel: "#0a1222",
      border: "#0d2137",
      muted: "#1a3a5a",
      text: "#c8d6e5",
      accent: "#00e5ff",
    },
    glow: "rgba(0, 229, 255, 0.15)",
    scanlines: true,
    fontMode: "mono",
    cardRadius: "none",
  },

  {
    id: "intelligence",
    name: "Intelligence",
    icon: "🕵️",
    description: "Classified intel operations",
    group: "tactical",
    colors: {
      base: "#0a0a0f",
      surface: "#0f0f18",
      panel: "#141420",
      border: "#1e1e35",
      muted: "#3a3a5c",
      text: "#d4d4e8",
      accent: "#7c6aff",
    },
    glow: "rgba(124, 106, 255, 0.12)",
    scanlines: false,
    fontMode: "mono",
    cardRadius: "none",
  },

  {
    id: "cyberpunk",
    name: "Neon Cyberpunk",
    icon: "🌆",
    description: "Neon glow, pulse animations, gradient cards",
    group: "tactical",
    colors: {
      base: "#0a0015",
      surface: "#100020",
      panel: "#150028",
      border: "#2d0040",
      muted: "#5a2d6a",
      text: "#e8d5f0",
      accent: "#ff2d95",
      accent2: "#00e5ff",
    },
    glow: "rgba(255, 45, 149, 0.25)",
    scanlines: false,
    fontMode: "mono",
    displayFont: "orbitron",
    cardRadius: "md",
    cardShadow: "glow",
    effect: "neon-cyberpunk",
    severityColors: {
      critical: "#ff2d55",
      high: "#ff8c00",
      medium: "#ffd600",
      low: "#00e5ff",
      info: "#a855f7",
    },
    gradientBanner: true,
  },

  {
    id: "arctic",
    name: "Arctic",
    icon: "❄️",
    description: "Polar research station",
    group: "tactical",
    colors: {
      base: "#070d14",
      surface: "#0b1320",
      panel: "#0e182a",
      border: "#1a2d4a",
      muted: "#3a5a7a",
      text: "#dce8f4",
      accent: "#4ecdc4",
    },
    glow: "rgba(78, 205, 196, 0.12)",
    scanlines: false,
    fontMode: "mono",
    cardRadius: "sm",
  },

  {
    id: "emerald",
    name: "Emerald Ops",
    icon: "🟢",
    description: "Night-vision tactical operations",
    group: "tactical",
    colors: {
      base: "#040a08",
      surface: "#081210",
      panel: "#0c1a16",
      border: "#153025",
      muted: "#2a5a45",
      text: "#c8e8d8",
      accent: "#10b981",
    },
    glow: "rgba(16, 185, 129, 0.12)",
    scanlines: false,
    fontMode: "mono",
    cardRadius: "none",
    cardShadow: "glow",
  },

  {
    id: "crimson",
    name: "Crimson Alert",
    icon: "🔴",
    description: "DEFCON 1 — maximum threat",
    group: "tactical",
    colors: {
      base: "#0f0808",
      surface: "#180c0c",
      panel: "#201010",
      border: "#3a1818",
      muted: "#6a3030",
      text: "#f0d0d0",
      accent: "#ef4444",
    },
    glow: "rgba(239, 68, 68, 0.15)",
    scanlines: true,
    fontMode: "mono",
    cardRadius: "none",
    effect: "alert-mode",
  },

  {
    id: "warzone",
    name: "Warzone",
    icon: "⚠️",
    description: "Red dominant, DEFCON bar, CRT scans, flashing alerts",
    group: "tactical",
    colors: {
      base: "#080404",
      surface: "#0c0606",
      panel: "#120808",
      border: "#2a1111",
      muted: "#553333",
      text: "#d4d4d4",
      accent: "#cc3333",
      accent2: "#ff8800",
    },
    glow: "rgba(200, 0, 0, 0.2)",
    scanlines: true,
    fontMode: "mono",
    displayFont: "rajdhani",
    cardRadius: "none",
    cardShadow: "none",
    effect: "warzone",
    severityColors: {
      critical: "#ff3333",
      high: "#ff8800",
      medium: "#cccc00",
      low: "#44aa44",
      info: "#6699cc",
    },
    defconBar: true,
    gridOverlay: "rgba(255,0,0,0.02)",
  },

  // ══════════════════════════════════════════════════════
  // DARK AMBIENT (7-10)
  // ══════════════════════════════════════════════════════

  {
    id: "amber",
    name: "Amber",
    icon: "🌅",
    description: "Warm desert operations",
    group: "ambient",
    colors: {
      base: "#0f0a05",
      surface: "#1a1208",
      panel: "#201a0c",
      border: "#3d2e14",
      muted: "#6b5530",
      text: "#e8dcc8",
      accent: "#f0a030",
    },
    glow: "rgba(240, 160, 48, 0.15)",
    scanlines: true,
    fontMode: "mono",
    cardRadius: "none",
  },

  {
    id: "midnight",
    name: "Midnight",
    icon: "🌙",
    description: "Deep ocean night watch",
    group: "ambient",
    colors: {
      base: "#020810",
      surface: "#041020",
      panel: "#061530",
      border: "#0a2550",
      muted: "#1a4570",
      text: "#b8d4f0",
      accent: "#3388ff",
    },
    glow: "rgba(51, 136, 255, 0.15)",
    scanlines: false,
    fontMode: "mono",
    cardRadius: "none",
  },

  {
    id: "tokyo",
    name: "Tokyo Night",
    icon: "🌃",
    description: "Soft neon city after midnight",
    group: "ambient",
    colors: {
      base: "#1a1b2e",
      surface: "#1e1f35",
      panel: "#24253d",
      border: "#2f3050",
      muted: "#565f89",
      text: "#c0caf5",
      accent: "#7aa2f7",
    },
    glow: "rgba(122, 162, 247, 0.1)",
    scanlines: false,
    fontMode: "mono",
    cardRadius: "md",
    cardShadow: "sm",
  },

  {
    id: "sandstorm",
    name: "Sandstorm",
    icon: "🏜️",
    description: "Desert surveillance outpost",
    group: "ambient",
    colors: {
      base: "#1c1610",
      surface: "#241e16",
      panel: "#2c261e",
      border: "#4a3c2a",
      muted: "#7a6a50",
      text: "#e8d8c0",
      accent: "#d4915a",
    },
    glow: "rgba(212, 145, 90, 0.1)",
    scanlines: false,
    fontMode: "mono",
    cardRadius: "sm",
  },

  // ══════════════════════════════════════════════════════
  // TERMINAL (11-13)
  // ══════════════════════════════════════════════════════

  {
    id: "bloomberg",
    name: "Bloomberg Terminal",
    icon: "📊",
    description: "Pure black, orange mono, ASCII, zero decoration",
    group: "terminal",
    colors: {
      base: "#000000",
      surface: "#0a0a0a",
      panel: "#111111",
      border: "#222222",
      muted: "#555555",
      text: "#ff8c00",
      accent: "#ff8c00",
      accent2: "#00ccff",
    },
    scanlines: false,
    fontMode: "mono",
    displayFont: "share-tech-mono",
    cardRadius: "none",
    cardShadow: "none",
    effect: "bloomberg-terminal",
    severityColors: {
      critical: "#ff2d2d",
      high: "#ff8c00",
      medium: "#cccc00",
      low: "#00cc66",
      info: "#666666",
    },
  },

  {
    id: "matrix",
    name: "Matrix",
    icon: "🖥️",
    description: "Green phosphor terminal rain",
    group: "terminal",
    colors: {
      base: "#000000",
      surface: "#020802",
      panel: "#041004",
      border: "#0a200a",
      muted: "#1a4a1a",
      text: "#00ff41",
      accent: "#00ff41",
    },
    glow: "rgba(0, 255, 65, 0.15)",
    scanlines: true,
    fontMode: "mono",
    cardRadius: "none",
    cardShadow: "glow",
    effect: "phosphor-glow",
  },

  {
    id: "solarized",
    name: "Solarized",
    icon: "☀️",
    description: "Developer-friendly warm dark",
    group: "terminal",
    colors: {
      base: "#002b36",
      surface: "#073642",
      panel: "#073642",
      border: "#586e75",
      muted: "#657b83",
      text: "#93a1a1",
      accent: "#268bd2",
    },
    glow: "rgba(38, 139, 210, 0.1)",
    scanlines: false,
    fontMode: "mono",
    cardRadius: "sm",
    cardShadow: "none",
  },

  // ══════════════════════════════════════════════════════
  // BROADCAST (14-15)
  // ══════════════════════════════════════════════════════

  {
    id: "broadcast",
    name: "Broadcast",
    icon: "📺",
    description: "24-hour news control room",
    group: "broadcast",
    colors: {
      base: "#0c0c14",
      surface: "#12121c",
      panel: "#181828",
      border: "#cc0000",
      muted: "#4a4a6a",
      text: "#f0f0f8",
      accent: "#cc0000",
    },
    glow: "rgba(204, 0, 0, 0.12)",
    scanlines: false,
    fontMode: "sans",
    cardRadius: "sm",
    cardShadow: "sm",
    effect: "broadcast-bar",
  },

  {
    id: "aljazeera",
    name: "Al Jazeera",
    icon: "🌐",
    description: "International broadcast network",
    group: "broadcast",
    colors: {
      base: "#0a0f14",
      surface: "#101820",
      panel: "#141e28",
      border: "#1e3040",
      muted: "#4a6070",
      text: "#e0e8f0",
      accent: "#d4a843",
    },
    glow: "rgba(212, 168, 67, 0.1)",
    scanlines: false,
    fontMode: "sans",
    cardRadius: "sm",
    cardShadow: "sm",
  },

  // ══════════════════════════════════════════════════════
  // MODERN (16)
  // ══════════════════════════════════════════════════════

  {
    id: "frost",
    name: "Frost Glass",
    icon: "✨",
    description: "Translucent glassmorphism",
    group: "modern",
    colors: {
      base: "#0f1729",
      surface: "#141e37",
      panel: "#192646",
      border: "#2a3a5c",
      muted: "#5a7aa0",
      text: "#e8f0ff",
      accent: "#60a5fa",
    },
    glow: "rgba(96, 165, 250, 0.1)",
    scanlines: false,
    fontMode: "sans",
    cardRadius: "lg",
    cardShadow: "md",
    effect: "glassmorphism",
  },

  // ══════════════════════════════════════════════════════
  // LIGHT EDITORIAL (17-20)
  // ══════════════════════════════════════════════════════

  {
    id: "reuters",
    name: "Reuters",
    icon: "📰",
    description: "Wire service newsroom",
    group: "editorial",
    colors: {
      base: "#fafafa",
      surface: "#ffffff",
      panel: "#f5f5f0",
      border: "#e0ddd5",
      muted: "#8a8780",
      text: "#1a1a18",
      accent: "#ff5722",
    },
    scanlines: false,
    fontMode: "sans",
    cardRadius: "md",
    cardShadow: "sm",
    lightMode: true,
  },

  {
    id: "economist",
    name: "The Economist",
    icon: "📕",
    description: "Authoritative editorial print",
    group: "editorial",
    colors: {
      base: "#fffdf7",
      surface: "#ffffff",
      panel: "#faf7f0",
      border: "#e8e0d0",
      muted: "#9a9080",
      text: "#1a1410",
      accent: "#e3120b",
    },
    scanlines: false,
    fontMode: "serif",
    cardRadius: "sm",
    cardShadow: "sm",
    lightMode: true,
  },

  {
    id: "paper",
    name: "Paper White",
    icon: "📄",
    description: "Minimal ink-on-paper",
    group: "editorial",
    colors: {
      base: "#ffffff",
      surface: "#ffffff",
      panel: "#fafafa",
      border: "#e5e5e5",
      muted: "#999999",
      text: "#111111",
      accent: "#111111",
    },
    scanlines: false,
    fontMode: "sans",
    cardRadius: "md",
    cardShadow: "sm",
    lightMode: true,
  },

  {
    id: "ivory",
    name: "Ivory Tower",
    icon: "🏛️",
    description: "Academic research briefing",
    group: "editorial",
    colors: {
      base: "#f8f5f0",
      surface: "#fffefa",
      panel: "#f0ece4",
      border: "#d8d0c0",
      muted: "#a09880",
      text: "#2a2420",
      accent: "#1a5276",
    },
    scanlines: false,
    fontMode: "serif",
    cardRadius: "sm",
    cardShadow: "sm",
    lightMode: true,
  },
];

export const DEFAULT_THEME = THEMES[0];

export const THEME_GROUPS = {
  tactical: "Dark Tactical",
  ambient: "Dark Ambient",
  terminal: "Terminal",
  broadcast: "Broadcast",
  modern: "Modern",
  editorial: "Light Editorial",
} as const;

export function getThemeById(id: string): DashboardTheme {
  return THEMES.find((t) => t.id === id) || DEFAULT_THEME;
}
