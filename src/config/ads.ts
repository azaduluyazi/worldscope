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
} satisfies Record<string, AdPlacement[]>;

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
