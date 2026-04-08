import type { ClusterEvent } from "./types";

// ═══════════════════════════════════════════════════════════════════
//  Source Independence / Syndication Model
// ═══════════════════════════════════════════════════════════════════
//
//  PROBLEM this solves:
//  --------------------
//  The convergence scorer treats every ClusterEvent as an independent
//  signal. But many of our sources are NOT independent:
//
//    • usgs-4.5w + usgs-2.5d + usgs-sig-month → same USGS catalog,
//      different magnitude thresholds. A M6.2 quake appears in ALL
//      three. Raw count = 3, true independent signals ≈ 1.
//
//    • gdelt-articles + gdelt-geo → same GDELT platform, two views
//      of the same underlying corpus.
//
//    • binance-ticker + coinbase-rates → crypto prices are
//      arbitrage-locked. A 5% BTC move hits both simultaneously.
//
//  Without this layer, correlated sources inflate confidence and
//  trigger false-high convergences. "5 sources reported it!" is
//  meaningless if 4 of them share a single upstream.
//
//  HOW THE SOLUTION WORKS:
//  -----------------------
//  1. We define SYNDICATION_GROUPS: clusters of operationally or
//     structurally related sourceIds, each with a `dampening` factor
//     in [0, 1] where:
//        0.0 → fully independent (don't put them in a group at all)
//        0.5 → half-overlapping (two similar feeds)
//        0.9 → near-total duplication (same data, different endpoint)
//        1.0 → identical (never useful — just remove one)
//
//  2. `computeEffectiveSignalCount()` takes a list of ClusterEvents
//     and returns a REAL number ≤ events.length representing how many
//     independent signals those events actually carry.
//
//  3. The scorer uses this effective count instead of events.length.
//     5 raw signals from a high-dampening group may become ~1.4
//     effective signals — scored accordingly.
//
// ═══════════════════════════════════════════════════════════════════

export type SyndicationRelationship =
  | "same_operator"      // Same organization publishes both (USGS feeds, GDELT endpoints)
  | "wire_syndication"   // One source re-publishes another's content (AP → local news)
  | "market_correlation" // Independent feeds but economically locked (crypto exchanges)
  | "topic_overlap";     // Same domain, lots of shared coverage (crypto news sites)

export interface SyndicationGroup {
  /** Unique identifier for this group (used in logs and UI explanations) */
  id: string;
  /** Human-readable description — shown in convergence debug view */
  name: string;
  /** Source IDs that belong to this group (must match keys in source-reliability.ts) */
  sources: string[];
  /** Why these sources are related */
  relationship: SyndicationRelationship;
  /**
   * Overlap factor in [0, 1]:
   *   0.3 = loose correlation (still mostly independent)
   *   0.6 = moderate (typical market correlation, topic overlap)
   *   0.8 = strong (same data source, different views)
   *   0.95 = near-identical (same feed, different threshold)
   */
  dampening: number;
}

// ═══════════════════════════════════════════════════════════════════
//  👇 USER CONTRIBUTION ZONE — fill in SYNDICATION_GROUPS below
// ═══════════════════════════════════════════════════════════════════
//
//  Review the sources in `source-reliability.ts` and add groups that
//  reflect your actual data lineage. I've pre-filled 3 "obvious" groups
//  as examples — please verify them and extend with 5-10 more.
//
//  Guidelines for adding groups:
//    • Only group sources you KNOW share data or operator
//    • When in doubt, use LOWER dampening (0.4-0.5)
//    • A source can appear in multiple groups (overlaps are fine)
//    • Keep groups SMALL (2-5 sources) — huge groups lose meaning
//    • Focus on HIGH-VOLUME sources first (USGS, GDELT, crypto)
//
//  The dampening formula dampens raw signal count. Example:
//    5 events from a group with dampening 0.9 →
//    effective ≈ 1 + (5-1) × (1 - 0.9) = 1.4 signals
//  Not 5. That's the whole point.
//
// ───────────────────────────────────────────────────────────────────

export const SYNDICATION_GROUPS: SyndicationGroup[] = [

  // ─── EXAMPLE 1 (verify this!) ───────────────────────────────────
  {
    id: "usgs-earthquake-catalog",
    name: "USGS earthquake feeds — same catalog, different magnitude thresholds",
    sources: ["usgs-4.5w", "usgs-2.5d", "usgs-sig-month"],
    relationship: "same_operator",
    // A M6.0 quake appears in ALL three feeds. Near-total duplication.
    dampening: 0.9,
  },

  // ─── EXAMPLE 2 (verify this!) ───────────────────────────────────
  {
    id: "gdelt-platform",
    name: "GDELT articles + geo — same platform, different endpoints",
    sources: ["gdelt-articles", "gdelt-geo"],
    relationship: "same_operator",
    // Same corpus, two views — but the geo view filters differently.
    dampening: 0.7,
  },

  // ─── EXAMPLE 3 (verify this!) ───────────────────────────────────
  {
    id: "crypto-price-feeds",
    name: "Crypto exchange price feeds — arbitrage-correlated",
    sources: ["binance-ticker", "coinbase-rates", "crypto-convert", "freeforex"],
    relationship: "market_correlation",
    // Prices differ by <0.1% due to arbitrage bots. A 5% BTC move
    // hits all four feeds within seconds.
    dampening: 0.65,
  },

  // ─── Vulnerability databases ────────────────────────────────────
  // cisa-kev is literally derived from nvd-cve (CISA curates a subset
  // of NIST's NVD with "known exploited" flag). Strong upstream coupling.
  {
    id: "vulnerability-databases",
    name: "CVE/Vulnerability databases — CISA KEV is curated from NVD",
    sources: ["cisa-kev", "nvd-cve"],
    relationship: "same_operator",
    dampening: 0.8,
  },

  // ─── Ransomware trackers ────────────────────────────────────────
  // Both scrape ransomware leak sites. Methodology is similar and
  // they often see the same incidents within minutes of each other.
  {
    id: "ransomware-leak-trackers",
    name: "Ransomware leak site trackers",
    sources: ["ransomware-live", "ransomlook"],
    relationship: "topic_overlap",
    dampening: 0.7,
  },

  // ─── NASA earth observation ─────────────────────────────────────
  // EONET and FIRMS are both NASA products. FIRMS is fire-specific,
  // EONET covers wildfires among other natural events. Wildfire events
  // overlap; other event types (storms, volcanoes) don't.
  {
    id: "nasa-earth-observation",
    name: "NASA Earth observation feeds (EONET + FIRMS overlap on wildfires)",
    sources: ["nasa-eonet", "nasa-firms"],
    relationship: "same_operator",
    dampening: 0.55,
  },

  // ─── Disaster aggregators ───────────────────────────────────────
  // GDACS (EU Joint Research Centre) and ReliefWeb (UN OCHA) are
  // independent orgs but both aggregate disaster data and cite each
  // other. Major disasters appear in both with editorial differences.
  {
    id: "disaster-aggregators",
    name: "Global disaster aggregators (GDACS + ReliefWeb)",
    sources: ["gdacs", "reliefweb"],
    relationship: "topic_overlap",
    dampening: 0.5,
  },

  // ─── Space launch trackers ──────────────────────────────────────
  // launch-library (TheSpaceDevs) is the de-facto aggregator. spacex
  // API feeds into it. spaceflight (spaceflightnow.com) is editorial
  // news based on the same announcements. All three announce the same
  // launches hours apart.
  {
    id: "space-launch-trackers",
    name: "Space launch trackers — all announce the same missions",
    sources: ["spacex", "launch-library", "spaceflight"],
    relationship: "topic_overlap",
    dampening: 0.75,
  },

  // ─── Formula 1 feeds ────────────────────────────────────────────
  // Both track the same F1 race calendar + telemetry. Any race weekend
  // produces duplicate events.
  {
    id: "formula-one-feeds",
    name: "F1 data feeds — same sport, same events",
    sources: ["openf1", "f1"],
    relationship: "topic_overlap",
    dampening: 0.85,
  },

  // ─── Sports data aggregators ────────────────────────────────────
  // ESPN is editorial, football-data and thesportsdb are data APIs.
  // They overlap heavily on major football/soccer events but diverge
  // on niche sports.
  {
    id: "sports-data-aggregators",
    name: "Sports data aggregators — football overlap",
    sources: ["espn-sports", "football-data", "thesportsdb"],
    relationship: "topic_overlap",
    dampening: 0.5,
  },

  // ─── Positive news curators ─────────────────────────────────────
  // Both curate "good news" stories. The pool of heartwarming/hopeful
  // stories is small; significant editorial overlap.
  {
    id: "positive-news-curators",
    name: "Positive news curators — same heartwarming-story pool",
    sources: ["good-news", "positive-news"],
    relationship: "topic_overlap",
    dampening: 0.7,
  },

  // ─── Crypto news sites ──────────────────────────────────────────
  // Crypto journalism is famously incestuous. CryptoPanic literally
  // aggregates from Cointelegraph and others. "crypto-news" is a
  // generic feed that often reposts.
  {
    id: "crypto-news-sites",
    name: "Crypto news sites — cross-citation ecosystem",
    sources: ["crypto-news", "cryptopanic", "cointelegraph"],
    relationship: "wire_syndication",
    dampening: 0.7,
  },

  // ─── Health monitoring (WHO + disease.sh) ───────────────────────
  // disease.sh is an open API that aggregates from WHO, Johns Hopkins,
  // Worldometers. When WHO publishes, disease.sh reflects it within
  // minutes. openfda (US FDA) and pubmed (research) are independent.
  {
    id: "health-monitoring",
    name: "Health surveillance — disease.sh mirrors WHO",
    sources: ["who", "disease-sh"],
    relationship: "wire_syndication",
    dampening: 0.75,
  },

  // ─── European energy grid ───────────────────────────────────────
  // entsoe is the European TSO network. energidataservice is Danish
  // (part of ENTSO-E). electricity-maps aggregates from entsoe + eia
  // + others. Significant upstream coupling within Europe.
  {
    id: "european-energy-grid",
    name: "European power grid feeds — ENTSO-E umbrella",
    sources: ["entsoe", "energidataservice", "electricity-maps"],
    relationship: "same_operator",
    dampening: 0.55,
  },

  // ─── Developer ecosystem signals ────────────────────────────────
  // npm-trends, stackoverflow, jsdelivr measure different things
  // (downloads, questions, CDN hits) but reflect the same underlying
  // developer attention. Major framework releases spike all three.
  {
    id: "developer-ecosystem",
    name: "Developer ecosystem signals — same underlying attention",
    sources: ["npm-trends", "stackoverflow", "jsdelivr"],
    relationship: "market_correlation",
    dampening: 0.4,
  },

  // ─── Crypto on-chain metrics ────────────────────────────────────
  // mempool-btc and blockchain-stats both query the Bitcoin blockchain.
  // They measure related metrics (mempool depth, hash rate, fees)
  // that move together during congestion events.
  {
    id: "bitcoin-onchain",
    name: "Bitcoin on-chain metrics — same blockchain",
    sources: ["mempool-btc", "blockchain-stats"],
    relationship: "market_correlation",
    dampening: 0.6,
  },

  // ─── US equity market signals ───────────────────────────────────
  // market-indices and finviz-movers reflect the same US market state
  // measured two ways. A major index move ALWAYS shows in both.
  {
    id: "us-equity-market",
    name: "US equity market state — indices + movers",
    sources: ["market-indices", "finviz-movers"],
    relationship: "market_correlation",
    dampening: 0.65,
  },

  // ─── NOTES ON SOURCES DELIBERATELY LEFT INDEPENDENT ─────────────
  //
  //   • kandilli (Kandilli Observatory, Turkey) is NOT grouped with
  //     USGS. It's an independent national seismology center with
  //     its own instrumentation. Independence is VALUABLE here —
  //     when both USGS AND Kandilli flag a quake in the Turkey
  //     region, that's strong corroboration. Don't dampen it away.
  //
  //   • eia (US Energy Information Administration) is NOT grouped
  //     with European grid feeds. Different continent, different
  //     regulatory system, genuinely independent.
  //
  //   • hibp-breaches (Have I Been Pwned) is NOT grouped with other
  //     cyber feeds. Troy Hunt's dataset is independently sourced
  //     from breach disclosures and darknet markets.
  //
  //   • pubmed is NOT grouped with who. Research papers and WHO
  //     policy announcements are genuinely independent signal types.
  //
  //   • safecast (citizen science radiation measurements) is fully
  //     independent. No grouping.
  //
  //   • gbif (biodiversity), oref (Israel military alerts),
  //     cloudflare-radar, space-weather — all independent.
  //
  // ────────────────────────────────────────────────────────────────
];

// ═══════════════════════════════════════════════════════════════════
//  👆 END OF USER CONTRIBUTION ZONE
//
//  Everything below is infrastructure — you don't need to edit it.
// ═══════════════════════════════════════════════════════════════════

// ── Lookup index: sourceId → list of groups it belongs to ────────────
// Built once at module load. If a source appears in no group, it's
// treated as fully independent.

const SOURCE_TO_GROUPS = new Map<string, SyndicationGroup[]>();

for (const group of SYNDICATION_GROUPS) {
  for (const sourceId of group.sources) {
    const existing = SOURCE_TO_GROUPS.get(sourceId) || [];
    existing.push(group);
    SOURCE_TO_GROUPS.set(sourceId, existing);
  }
}

/**
 * Get the syndication groups a source belongs to (if any).
 * Used by convergence debug UI to explain scoring decisions.
 */
export function getGroupsForSource(sourceId: string): SyndicationGroup[] {
  return SOURCE_TO_GROUPS.get(sourceId) || [];
}

/**
 * Compute the "effective" signal count for a set of events, accounting
 * for source syndication overlap.
 *
 * Algorithm:
 *   1. Assign each event to its strongest syndication group (if any).
 *   2. For each group with k events, the effective contribution is:
 *        1 + (k - 1) × (1 - dampening)
 *      This means:
 *        - 1st event in a group counts fully (1.0)
 *        - each additional event counts (1 - dampening) — e.g. 0.1 at dampening=0.9
 *   3. Events that don't belong to any group each count as 1.0.
 *
 * Examples:
 *   • 3 USGS events (dampening 0.9):  1 + 2×0.1 = 1.2 effective
 *   • 4 crypto events (dampening 0.65): 1 + 3×0.35 = 2.05 effective
 *   • 5 independent events (no group): 5.0 effective
 *
 * Returns a real number in [1, events.length].
 */
export function computeEffectiveSignalCount(events: ClusterEvent[]): number {
  if (events.length === 0) return 0;
  if (events.length === 1) return 1;

  // Partition: events per group + ungrouped
  const groupBuckets = new Map<string, ClusterEvent[]>();
  const ungrouped: ClusterEvent[] = [];

  for (const event of events) {
    const groups = getGroupsForSource(event.sourceId);
    if (groups.length === 0) {
      ungrouped.push(event);
      continue;
    }
    // If a source is in multiple groups, use the one with HIGHEST dampening
    // (most conservative — assume maximum overlap)
    const dominantGroup = groups.reduce((a, b) =>
      a.dampening >= b.dampening ? a : b
    );
    const bucket = groupBuckets.get(dominantGroup.id) || [];
    bucket.push(event);
    groupBuckets.set(dominantGroup.id, bucket);
  }

  // Sum contributions
  let effective = ungrouped.length; // each counts as 1.0

  for (const [groupId, bucket] of groupBuckets) {
    const group = SYNDICATION_GROUPS.find((g) => g.id === groupId);
    if (!group) {
      // Shouldn't happen, but be defensive
      effective += bucket.length;
      continue;
    }
    const k = bucket.length;
    // 1st event full, rest dampened
    effective += 1 + (k - 1) * (1 - group.dampening);
  }

  return effective;
}

/**
 * Diagnostic: for a given event set, return a breakdown of which
 * syndication groups are active. Useful for the convergence debug view
 * so users can see WHY a signal count was dampened.
 */
export interface SyndicationBreakdown {
  rawCount: number;
  effectiveCount: number;
  reduction: number; // rawCount - effectiveCount
  activeGroups: {
    group: SyndicationGroup;
    eventCount: number;
    contribution: number;
  }[];
  ungroupedCount: number;
}

export function explainSyndication(events: ClusterEvent[]): SyndicationBreakdown {
  const raw = events.length;
  const effective = computeEffectiveSignalCount(events);

  const groupCounts = new Map<string, number>();
  let ungrouped = 0;

  for (const event of events) {
    const groups = getGroupsForSource(event.sourceId);
    if (groups.length === 0) {
      ungrouped++;
      continue;
    }
    const dominant = groups.reduce((a, b) =>
      a.dampening >= b.dampening ? a : b
    );
    groupCounts.set(dominant.id, (groupCounts.get(dominant.id) || 0) + 1);
  }

  const activeGroups = Array.from(groupCounts.entries())
    .map(([groupId, count]) => {
      const group = SYNDICATION_GROUPS.find((g) => g.id === groupId)!;
      const contribution = 1 + (count - 1) * (1 - group.dampening);
      return { group, eventCount: count, contribution };
    })
    .sort((a, b) => b.eventCount - a.eventCount);

  return {
    rawCount: raw,
    effectiveCount: effective,
    reduction: raw - effective,
    activeGroups,
    ungroupedCount: ungrouped,
  };
}
