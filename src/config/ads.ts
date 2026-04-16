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
 * ─── REAL SLOTS (2026-04-16, full rollout) ───────────────────────
 * All 11 AdSense ad units now exist in the dashboard. Each slot is a
 * separate unit so AdSense reports per-placement eCPM and we can
 * optimize individually:
 *
 *   ws-country-top      → 8802953822  (display · horizontal · responsive)
 *   ws-report-top       → 7148746364  (display · horizontal · responsive)
 *   ws-report-inline    → 3550627148  (display · square · responsive)
 *   ws-reports-top      → 3048064269  (display · horizontal · responsive)
 *   ws-landing-bottom   → 8693987667  (display · horizontal · responsive)
 *   ws-analytics-bottom → 4036557358  (display · horizontal · responsive)
 *   ws-feeds-top        → 8121261691  (display · horizontal · responsive)
 *   ws-search-inline    → 5046386692  (display · square · responsive)
 *   ws-blog-list        → 3733305022  (display · horizontal · responsive)
 *   ws-blog-post        → 9421900926  (display · horizontal · responsive)
 *   ws-feed-native      → 8611382135  (display · square · responsive)
 *
 * Pages that consume each slot:
 *   country-top     → /country/[code], /country/[code]/[variant]
 *   report-top      → /reports/[type]/[date]
 *   report-inline   → /events/[id]
 *   reports-top     → /reports (list)
 *   landing-bottom  → currently reserved; NOT /briefing (ad-free landing)
 *   analytics-bottom→ /analytics, /about (shared)
 *   feeds-top       → /feeds
 *   search-inline   → /search
 *   blog-list       → /blog
 *   blog-post       → /blog/[slug]
 *   feed-native     → IntelFeed component (inserted every FEED_AD_INTERVAL items)
 *
 * Intentionally AD-FREE (do NOT wire AdSense here):
 *   /briefing, /editorial-policy, /corrections, /ownership,
 *   /embed/*, /privacy, /terms, /cookies, /disclaimer, /refund
 * ──────────────────────────────────────────────────────────────────
 */

// Real slot IDs — single source of truth so placements reusing the same
// unit share one constant (country ↔ variant both use country-top).
const REAL_SLOTS = {
  countryTop: "8802953822",
  reportTop: "7148746364",
  reportInline: "3550627148",
  reportsTop: "3048064269",
  landingBottom: "8693987667",
  analyticsBottom: "4036557358",
  feedsTop: "8121261691",
  searchInline: "5046386692",
  blogList: "3733305022",
  blogPost: "9421900926",
  feedNative: "8611382135",
} as const;

export const AD_PLACEMENTS = {
  country: [
    { id: "country-top", type: "adsense" as const, slot: REAL_SLOTS.countryTop, format: "horizontal", position: "top" as const, enabled: true },
    { id: "country-sidebar", type: "carbon" as const, position: "sidebar" as const, enabled: true },
    { id: "country-bottom", type: "affiliate" as const, position: "bottom" as const, enabled: true },
  ],
  report: [
    { id: "report-top", type: "adsense" as const, slot: REAL_SLOTS.reportTop, format: "horizontal", position: "top" as const, enabled: true },
    { id: "report-inline", type: "adsense" as const, slot: REAL_SLOTS.reportInline, format: "rectangle", position: "inline" as const, enabled: true },
    { id: "report-bottom", type: "carbon" as const, position: "bottom" as const, enabled: true },
  ],
  reportsList: [
    { id: "reports-top", type: "adsense" as const, slot: REAL_SLOTS.reportsTop, format: "horizontal", position: "top" as const, enabled: true },
  ],
  // ── New ad placements (Session 7 — Revenue Maximization) ──
  landing: [
    { id: "landing-bottom", type: "adsense" as const, slot: REAL_SLOTS.landingBottom, format: "horizontal", position: "bottom" as const, enabled: true },
  ],
  analytics: [
    { id: "analytics-bottom", type: "adsense" as const, slot: REAL_SLOTS.analyticsBottom, format: "horizontal", position: "bottom" as const, enabled: true },
  ],
  feeds: [
    { id: "feeds-top", type: "adsense" as const, slot: REAL_SLOTS.feedsTop, format: "horizontal", position: "top" as const, enabled: true },
  ],
  search: [
    { id: "search-inline", type: "adsense" as const, slot: REAL_SLOTS.searchInline, format: "rectangle", position: "inline" as const, enabled: true },
  ],
  variant: [
    // Reuses the country-top slot — same publisher, same placement shape
    { id: "variant-bottom", type: "adsense" as const, slot: REAL_SLOTS.countryTop, format: "horizontal", position: "bottom" as const, enabled: true },
  ],
  blog: [
    { id: "blog-list", type: "adsense" as const, slot: REAL_SLOTS.blogList, format: "horizontal", position: "top" as const, enabled: true },
    { id: "blog-post", type: "adsense" as const, slot: REAL_SLOTS.blogPost, format: "horizontal", position: "top" as const, enabled: true },
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
