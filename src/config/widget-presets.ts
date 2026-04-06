/**
 * Widget preset configurations for different user personas.
 *
 * Each preset defines which widgets are visible and in what order.
 * The WidgetGrid component uses these as starting points —
 * users can then customize further with drag-and-drop.
 */

export interface WidgetPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Widget IDs to show, in display order */
  widgets: string[];
}

export const WIDGET_PRESETS: WidgetPreset[] = [
  {
    id: "analyst",
    name: "Intelligence Analyst",
    description: "Full OSINT layout — map, feed, convergence, escalation, and AI brief",
    icon: "🕵️",
    widgets: [
      "map",
      "intel-feed",
      "convergence",
      "escalation",
      "ai-brief",
      "threat-index",
      "timeline",
      "sources",
    ],
  },
  {
    id: "trader",
    name: "Market Trader",
    description: "Financial focus — markets, crypto, commodities, fear/greed, and news",
    icon: "📈",
    widgets: [
      "map",
      "market-ticker",
      "intel-feed",
      "threat-index",
      "predictions",
      "economics",
    ],
  },
  {
    id: "journalist",
    name: "Journalist",
    description: "Breaking news focus — large feed, live broadcasts, trending, and map",
    icon: "📰",
    widgets: [
      "intel-feed",
      "live-broadcasts",
      "trending",
      "map",
      "timeline",
    ],
  },
  {
    id: "executive",
    name: "Executive Brief",
    description: "High-level overview — threat index, AI brief, map, and key metrics",
    icon: "👔",
    widgets: [
      "threat-index",
      "ai-brief",
      "map",
      "market-ticker",
      "convergence",
    ],
  },
  {
    id: "cyber",
    name: "Cyber Analyst",
    description: "Cybersecurity focus — threats, CVEs, ransomware, GPS jamming, and internet outages",
    icon: "🛡️",
    widgets: [
      "map",
      "intel-feed",
      "threat-index",
      "sources",
      "convergence",
    ],
  },
  {
    id: "all",
    name: "Everything",
    description: "All widgets enabled — for power users with large screens",
    icon: "🔥",
    widgets: [
      "map",
      "intel-feed",
      "live-broadcasts",
      "market-ticker",
      "threat-index",
      "convergence",
      "escalation",
      "ai-brief",
      "timeline",
      "trending",
      "predictions",
      "economics",
      "sources",
      "podcast",
    ],
  },
];
