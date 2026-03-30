/** Ad placement configuration */

export interface AdPlacement {
  id: string;
  type: "adsense" | "carbon" | "affiliate";
  slot?: string;           // AdSense slot ID
  format?: string;         // AdSense format
  position: "top" | "sidebar" | "inline" | "bottom";
  enabled: boolean;
}

/** AdSense publisher ID — set via env */
export const ADSENSE_PUB_ID = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID || "";

/** Carbon Ads serve URL */
export const CARBON_SERVE = process.env.NEXT_PUBLIC_CARBON_SERVE || "";
export const CARBON_PLACEMENT = process.env.NEXT_PUBLIC_CARBON_PLACEMENT || "";

/** Ad placements for different page types */
export const AD_PLACEMENTS = {
  country: [
    { id: "country-top", type: "adsense" as const, slot: "1234567890", format: "horizontal", position: "top" as const, enabled: true },
    { id: "country-sidebar", type: "carbon" as const, position: "sidebar" as const, enabled: true },
    { id: "country-bottom", type: "affiliate" as const, position: "bottom" as const, enabled: true },
  ],
  report: [
    { id: "report-top", type: "adsense" as const, slot: "0987654321", format: "horizontal", position: "top" as const, enabled: true },
    { id: "report-inline", type: "adsense" as const, slot: "1122334455", format: "rectangle", position: "inline" as const, enabled: true },
    { id: "report-bottom", type: "carbon" as const, position: "bottom" as const, enabled: true },
  ],
  reportsList: [
    { id: "reports-top", type: "adsense" as const, slot: "5566778899", format: "horizontal", position: "top" as const, enabled: true },
  ],
  // ── New ad placements (Session 7 — Revenue Maximization) ──
  landing: [
    { id: "landing-bottom", type: "adsense" as const, slot: "2233445566", format: "horizontal", position: "bottom" as const, enabled: true },
  ],
  analytics: [
    { id: "analytics-bottom", type: "adsense" as const, slot: "3344556677", format: "horizontal", position: "bottom" as const, enabled: true },
  ],
  feeds: [
    { id: "feeds-top", type: "adsense" as const, slot: "4455667788", format: "horizontal", position: "top" as const, enabled: true },
  ],
  search: [
    { id: "search-inline", type: "adsense" as const, slot: "5566778800", format: "rectangle", position: "inline" as const, enabled: true },
  ],
  variant: [
    { id: "variant-bottom", type: "adsense" as const, slot: "6677889900", format: "horizontal", position: "bottom" as const, enabled: true },
  ],
  /** Native ad inserted every N items in IntelFeed */
  feed: [
    { id: "feed-native", type: "adsense" as const, slot: "7788990011", format: "auto", position: "inline" as const, enabled: true },
  ],
} satisfies Record<string, AdPlacement[]>;

/** How often to show native ads in feed (every N items) */
export const FEED_AD_INTERVAL = 15;

/** Affiliate links — rotated randomly */
export const AFFILIATE_BANNERS = [
  {
    id: "broker-1",
    title: "Trade Global Markets",
    description: "Access 10,000+ instruments with tight spreads",
    cta: "Start Trading",
    url: "#", // Replace with actual affiliate URL
    color: "#00e5ff",
  },
  {
    id: "vpn-1",
    title: "Secure Your Connection",
    description: "Military-grade encryption for analysts",
    cta: "Get Protected",
    url: "#",
    color: "#00ff88",
  },
  {
    id: "cyber-1",
    title: "Threat Intelligence Platform",
    description: "Enterprise-grade cyber threat monitoring",
    cta: "Free Trial",
    url: "#",
    color: "#8a5cf6",
  },
];
