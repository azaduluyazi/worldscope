export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type Category =
  | "conflict"
  | "finance"
  | "cyber"
  | "tech"
  | "natural"
  | "aviation"
  | "energy"
  | "diplomacy"
  | "protest"
  | "health";

export interface IntelItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  category: Category;
  severity: Severity;
  publishedAt: string;
  lat?: number;
  lng?: number;
  countryCode?: string;
  imageUrl?: string;
}

export interface IntelFeedResponse {
  items: IntelItem[];
  lastUpdated: string;
  total: number;
}

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "#ff4757",
  high: "#ffd000",
  medium: "#00e5ff",
  low: "#00ff88",
  info: "#8a5cf6",
};

export const CATEGORY_ICONS: Record<Category, string> = {
  conflict: "⚔️",
  finance: "📊",
  cyber: "🛡️",
  tech: "💻",
  natural: "🌍",
  aviation: "✈️",
  energy: "⚡",
  diplomacy: "🏛️",
  protest: "📢",
  health: "🏥",
};
