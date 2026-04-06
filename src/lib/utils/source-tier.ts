/**
 * Client-safe source reliability tier lookup.
 *
 * This is a lightweight version of source-reliability.ts that works
 * in client components — it uses only the static tier map without
 * requiring server-side gateway health data.
 *
 * Tier 1 (0.90-0.95): Official/institutional (USGS, NASA, WHO, OREF)
 * Tier 2 (0.75-0.85): Established aggregators (GDELT, ReliefWeb, NVD)
 * Tier 3 (0.60-0.70): Specialized/community sources
 * Tier 4 (0.40-0.55): News/RSS aggregators
 */

const TIER_MAP: Record<string, { score: number; tier: 1 | 2 | 3 | 4 }> = {
  // Tier 1 — Official / Institutional
  oref: { score: 0.95, tier: 1 },
  "usgs-4.5w": { score: 0.95, tier: 1 },
  "usgs-2.5d": { score: 0.93, tier: 1 },
  "usgs-sig-month": { score: 0.93, tier: 1 },
  gdacs: { score: 0.92, tier: 1 },
  "nasa-eonet": { score: 0.92, tier: 1 },
  "nasa-firms": { score: 0.92, tier: 1 },
  who: { score: 0.9, tier: 1 },
  "cisa-kev": { score: 0.9, tier: 1 },
  openfda: { score: 0.9, tier: 1 },
  "un-news": { score: 0.9, tier: 1 },
  "space-weather": { score: 0.9, tier: 1 },

  // Tier 2 — Established aggregators
  "gdelt-articles": { score: 0.85, tier: 2 },
  "gdelt-geo": { score: 0.83, tier: 2 },
  reliefweb: { score: 0.85, tier: 2 },
  "cloudflare-radar": { score: 0.82, tier: 2 },
  entsoe: { score: 0.82, tier: 2 },
  eia: { score: 0.85, tier: 2 },
  "electricity-maps": { score: 0.8, tier: 2 },
  kandilli: { score: 0.8, tier: 2 },
  "disease-sh": { score: 0.78, tier: 2 },
  pubmed: { score: 0.82, tier: 2 },
  "nvd-cve": { score: 0.8, tier: 2 },
  "binance-ticker": { score: 0.78, tier: 2 },
  "market-indices": { score: 0.8, tier: 2 },

  // Tier 3 — Specialized / Community
  cyber: { score: 0.7, tier: 3 },
  hackernews: { score: 0.65, tier: 3 },
  "supply-chain": { score: 0.68, tier: 3 },
  "ransomware-live": { score: 0.68, tier: 3 },
  spaceflight: { score: 0.68, tier: 3 },
  spacex: { score: 0.7, tier: 3 },
  "espn-sports": { score: 0.68, tier: 3 },
  "football-data": { score: 0.65, tier: 3 },

  // Tier 4 — News / RSS
  "crisis-news": { score: 0.55, tier: 4 },
  "crypto-news": { score: 0.5, tier: 4 },
  "good-news": { score: 0.45, tier: 4 },
};

const DEFAULT: { score: number; tier: 1 | 2 | 3 | 4 } = {
  score: 0.45,
  tier: 4,
};

export function getSourceTier(sourceId: string): {
  score: number;
  tier: 1 | 2 | 3 | 4;
} {
  return TIER_MAP[sourceId] || DEFAULT;
}
