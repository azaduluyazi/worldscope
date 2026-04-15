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

/**
 * Ad placements for different page types.
 *
 * ─── REAL SLOTS (2026-04-16) ─────────────────────────────────────
 * Only 3 AdSense ad units exist in the dashboard right now:
 *
 *   country-top    → 8802953822  (display · horizontal · responsive)
 *   report-inline  → 3550627148  (display · square · responsive)
 *   feed-native    → 8611382135  (display · square · responsive)
 *
 * Reused across pages (publisher policy allows ≤3 display per page):
 *   - country-top is rendered on country pages + country-variant pages
 *     (`variant` placement borrows the same slot)
 *   - report-inline is rendered on event pages + report detail + reports list
 *   - feed-native is rendered inside IntelFeed every FEED_AD_INTERVAL items
 *
 * All other placements are kept as config stubs but DISABLED until we
 * create real slots for them (or promote them to auto-ads mode).
 * ──────────────────────────────────────────────────────────────────
 */

// Real slot IDs live here so placements that reuse the same unit share one source
const REAL_SLOTS = {
  countryTop: "8802953822",
  reportInline: "3550627148",
  feedNative: "8611382135",
} as const;

export const AD_PLACEMENTS = {
  country: [
    { id: "country-top", type: "adsense" as const, slot: REAL_SLOTS.countryTop, format: "horizontal", position: "top" as const, enabled: true },
    { id: "country-sidebar", type: "carbon" as const, position: "sidebar" as const, enabled: true },
    { id: "country-bottom", type: "affiliate" as const, position: "bottom" as const, enabled: true },
  ],
  report: [
    // report-top needs its own ad unit — disabled until created
    { id: "report-top", type: "adsense" as const, slot: "0", format: "horizontal", position: "top" as const, enabled: false },
    { id: "report-inline", type: "adsense" as const, slot: REAL_SLOTS.reportInline, format: "rectangle", position: "inline" as const, enabled: true },
    { id: "report-bottom", type: "carbon" as const, position: "bottom" as const, enabled: true },
  ],
  reportsList: [
    // disabled: needs dedicated ad unit
    { id: "reports-top", type: "adsense" as const, slot: "0", format: "horizontal", position: "top" as const, enabled: false },
  ],
  // ── New ad placements (Session 7 — Revenue Maximization) ──
  landing: [
    // disabled: needs dedicated ad unit; /briefing is intentionally ad-free
    { id: "landing-bottom", type: "adsense" as const, slot: "0", format: "horizontal", position: "bottom" as const, enabled: false },
  ],
  analytics: [
    // disabled: needs dedicated ad unit
    { id: "analytics-bottom", type: "adsense" as const, slot: "0", format: "horizontal", position: "bottom" as const, enabled: false },
  ],
  feeds: [
    // disabled: needs dedicated ad unit
    { id: "feeds-top", type: "adsense" as const, slot: "0", format: "horizontal", position: "top" as const, enabled: false },
  ],
  search: [
    // disabled: needs dedicated ad unit — and /search is noindex anyway
    { id: "search-inline", type: "adsense" as const, slot: "0", format: "rectangle", position: "inline" as const, enabled: false },
  ],
  variant: [
    // Reuses the country-top slot — same publisher, same placement shape
    { id: "variant-bottom", type: "adsense" as const, slot: REAL_SLOTS.countryTop, format: "horizontal", position: "bottom" as const, enabled: true },
  ],
  /** Native ad inserted every N items in IntelFeed */
  feed: [
    { id: "feed-native", type: "adsense" as const, slot: REAL_SLOTS.feedNative, format: "auto", position: "inline" as const, enabled: true },
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
