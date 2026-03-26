import { getGatewayHealth } from "@/lib/api/gateway";
import type { SourceReliability } from "./types";

// ── Static baseline scores per source ──────────────────
// Tier 1: Government/institutional primary sources
// Tier 2: Established data aggregators
// Tier 3: Community/specialized sources
// Tier 4: News aggregators and RSS feeds

const STATIC_SCORES: Record<string, { base: number; tier: 1 | 2 | 3 | 4 }> = {
  // Tier 1 — Official / Institutional (0.90-0.95)
  "oref":              { base: 0.95, tier: 1 },
  "usgs-4.5w":         { base: 0.95, tier: 1 },
  "usgs-2.5d":         { base: 0.93, tier: 1 },
  "usgs-sig-month":    { base: 0.93, tier: 1 },
  "gdacs":             { base: 0.92, tier: 1 },
  "nasa-eonet":        { base: 0.92, tier: 1 },
  "nasa-firms":        { base: 0.92, tier: 1 },
  "who":               { base: 0.90, tier: 1 },
  "cisa-kev":          { base: 0.90, tier: 1 },
  "openfda":           { base: 0.90, tier: 1 },
  "un-news":           { base: 0.90, tier: 1 },
  "space-weather":     { base: 0.90, tier: 1 },

  // Tier 2 — Established aggregators (0.75-0.85)
  "gdelt-articles":    { base: 0.85, tier: 2 },
  "gdelt-geo":         { base: 0.83, tier: 2 },
  "reliefweb":         { base: 0.85, tier: 2 },
  "cloudflare-radar":  { base: 0.82, tier: 2 },
  "entsoe":            { base: 0.82, tier: 2 },
  "eia":               { base: 0.85, tier: 2 },
  "electricity-maps":  { base: 0.80, tier: 2 },
  "energidataservice": { base: 0.80, tier: 2 },
  "safecast":          { base: 0.78, tier: 2 },
  "kandilli":          { base: 0.80, tier: 2 },
  "disease-sh":        { base: 0.78, tier: 2 },
  "pubmed":            { base: 0.82, tier: 2 },
  "nvd-cve":           { base: 0.80, tier: 2 },
  "binance-ticker":    { base: 0.78, tier: 2 },
  "coinbase-rates":    { base: 0.78, tier: 2 },
  "freeforex":         { base: 0.75, tier: 2 },
  "mempool-btc":       { base: 0.75, tier: 2 },
  "blockchain-stats":  { base: 0.75, tier: 2 },
  "market-indices":    { base: 0.80, tier: 2 },
  "finviz-movers":     { base: 0.78, tier: 2 },

  // Tier 3 — Specialized / Community (0.60-0.70)
  "cyber":             { base: 0.70, tier: 3 },
  "hackernews":        { base: 0.65, tier: 3 },
  "supply-chain":      { base: 0.68, tier: 3 },
  "ransomware-live":   { base: 0.68, tier: 3 },
  "ransomlook":        { base: 0.65, tier: 3 },
  "hibp-breaches":     { base: 0.70, tier: 3 },
  "risk-sentinel":     { base: 0.65, tier: 3 },
  "sar-interference":  { base: 0.65, tier: 3 },
  "spaceflight":       { base: 0.68, tier: 3 },
  "spacex":            { base: 0.70, tier: 3 },
  "launch-library":    { base: 0.70, tier: 3 },
  "gbif":              { base: 0.65, tier: 3 },
  "npm-trends":        { base: 0.60, tier: 3 },
  "stackoverflow":     { base: 0.60, tier: 3 },
  "jsdelivr":          { base: 0.60, tier: 3 },
  "tv-screener":       { base: 0.68, tier: 3 },
  "football-data":     { base: 0.65, tier: 3 },
  "espn-sports":       { base: 0.68, tier: 3 },
  "openf1":            { base: 0.65, tier: 3 },
  "f1":                { base: 0.65, tier: 3 },
  "nba-stats":         { base: 0.65, tier: 3 },
  "transfermarkt":     { base: 0.60, tier: 3 },
  "cricket":           { base: 0.60, tier: 3 },
  "thesportsdb":       { base: 0.60, tier: 3 },
  "nhl-scores":        { base: 0.60, tier: 3 },

  // Tier 4 — News / RSS / Aggregators (0.40-0.55)
  "crisis-news":       { base: 0.55, tier: 4 },
  "crypto-news":       { base: 0.50, tier: 4 },
  "cryptopanic":       { base: 0.50, tier: 4 },
  "crypto-convert":    { base: 0.48, tier: 4 },
  "cointelegraph":     { base: 0.50, tier: 4 },
  "dollar-toman":      { base: 0.50, tier: 4 },
  "good-news":         { base: 0.45, tier: 4 },
  "positive-news":     { base: 0.45, tier: 4 },
};

// Default for unknown/RSS sources
const DEFAULT_SCORE = { base: 0.45, tier: 4 as const };

/**
 * Get reliability score for a source.
 * Combines static baseline with dynamic gateway health modifier.
 */
export function getSourceReliability(sourceId: string): SourceReliability {
  const { base, tier } = STATIC_SCORES[sourceId] || DEFAULT_SCORE;

  // Dynamic modifier from gateway health
  const health = getGatewayHealth();
  const sourceHealth = health.find((h) => h.sourceId === sourceId);

  let modifier = 0;
  if (sourceHealth) {
    if (sourceHealth.isOpen) {
      // Circuit open — severe penalty
      modifier = -0.20;
    } else if (sourceHealth.failures === 0) {
      // Perfect health — small bonus
      modifier = 0.05;
    } else if (sourceHealth.failures >= 3) {
      // Degraded — moderate penalty
      modifier = -0.10;
    }
  }

  const dynamicScore = Math.max(0, Math.min(1, base + modifier));

  return { sourceId, baseScore: base, dynamicScore, tier };
}

/**
 * Get reliability scores for multiple sources at once.
 */
export function getBulkReliability(sourceIds: string[]): Map<string, SourceReliability> {
  const health = getGatewayHealth();
  const healthMap = new Map(health.map((h) => [h.sourceId, h]));
  const result = new Map<string, SourceReliability>();

  for (const sourceId of sourceIds) {
    const { base, tier } = STATIC_SCORES[sourceId] || DEFAULT_SCORE;
    const sourceHealth = healthMap.get(sourceId);

    let modifier = 0;
    if (sourceHealth) {
      if (sourceHealth.isOpen) modifier = -0.20;
      else if (sourceHealth.failures === 0) modifier = 0.05;
      else if (sourceHealth.failures >= 3) modifier = -0.10;
    }

    result.set(sourceId, {
      sourceId,
      baseScore: base,
      dynamicScore: Math.max(0, Math.min(1, base + modifier)),
      tier,
    });
  }

  return result;
}
