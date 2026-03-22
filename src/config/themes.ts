/**
 * Dashboard Theme System — 6 visual themes.
 * Each theme defines CSS custom property overrides.
 */

export interface DashboardTheme {
  id: string;
  name: string;
  icon: string;
  description: string;
  colors: {
    base: string;
    surface: string;
    panel: string;
    border: string;
    muted: string;
    text: string;
    accent: string;
  };
  glow?: string;        // Optional glow/shadow color
  scanlines?: boolean;   // Show CRT scanlines overlay
}

export const THEMES: DashboardTheme[] = [
  // ── 0: Military HUD (Default) ──────────────────────
  {
    id: "military",
    name: "Military HUD",
    icon: "🎖️",
    description: "Dark tactical command center",
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
  },

  // ── 1: Intelligence ─────────────────────────────────
  {
    id: "intelligence",
    name: "Intelligence",
    icon: "🕵️",
    description: "Classified intel operations theme",
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
  },

  // ── 2: Cyberpunk ────────────────────────────────────
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    icon: "🌆",
    description: "Neon-soaked night city aesthetics",
    colors: {
      base: "#0d0011",
      surface: "#130018",
      panel: "#1a0022",
      border: "#2d0040",
      muted: "#5a2d6a",
      text: "#e8d5f0",
      accent: "#ff2d95",
    },
    glow: "rgba(255, 45, 149, 0.2)",
    scanlines: true,
  },

  // ── 3: Arctic ───────────────────────────────────────
  {
    id: "arctic",
    name: "Arctic",
    icon: "❄️",
    description: "Clean polar research station",
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
  },

  // ── 4: Amber ────────────────────────────────────────
  {
    id: "amber",
    name: "Amber",
    icon: "🌅",
    description: "Warm desert operations center",
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
  },

  // ── 5: Midnight ─────────────────────────────────────
  {
    id: "midnight",
    name: "Midnight",
    icon: "🌙",
    description: "Deep ocean night watch",
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
  },
];

export const DEFAULT_THEME = THEMES[0];

export function getThemeById(id: string): DashboardTheme {
  return THEMES.find((t) => t.id === id) || DEFAULT_THEME;
}
