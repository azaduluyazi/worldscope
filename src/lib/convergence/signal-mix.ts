/**
 * Signal Mix Analyzer.
 *
 * Takes a list of (source, count) pairs and produces a diagnostic report
 * about the epistemic diversity of the convergence pipeline. This is what
 * the admin dashboard and the daily alert cron both consume.
 *
 * WHY: Raw feed counts are misleading — 591 feeds sounds impressive but if
 * 95% of events come from 5 wire services, the convergence engine can't do
 * its job (no heterogeneous agreement possible). This module surfaces that.
 *
 * Kept as a pure function (no Supabase, no env) so it's trivially testable.
 */

import { getBulkReliability } from "./source-reliability";

/** One row of "this source produced N events in the window" */
export interface SourceHit {
  source: string;
  count: number;
}

/** Tier distribution — how many events per reliability tier */
export interface TierDistribution {
  tier: 1 | 2 | 3 | 4 | "unknown";
  events: number;
  sourceCount: number;
  percentage: number;
}

/** An anomaly the dashboard should highlight */
export interface SignalAnomaly {
  severity: "warning" | "critical";
  code:
    | "SOCIAL_LAYER_UNDERCONTRIBUTING"
    | "NEW_SOURCE_ZERO_EVENTS"
    | "TIER_IMBALANCE"
    | "NO_EVENTS";
  message: string;
  sources?: string[];
  metric?: number;
}

export interface SignalMixReport {
  windowHours: number;
  totalEvents: number;
  totalSources: number;
  tierDistribution: TierDistribution[];
  topSources: SourceHit[];
  newSourceStatus: Array<{
    source: string;
    status: "healthy" | "zero-events" | "missing";
    eventCount: number;
  }>;
  anomalies: SignalAnomaly[];
  /** Percentage of events coming from T4 community/social sources */
  socialLayerPct: number;
}

/**
 * The new feeds added in migration 013 — we want to verify these
 * specifically because they're the newest additions and the most likely
 * to be broken if anything went wrong with the migration or RSS parsing.
 *
 * REMOVED from tracking (still in feeds table, just not alerted on):
 *   - "Reddit r/earthquake"   — community is dead (last fresh post 2024-07);
 *                                permanent zero-events triggers false alarms
 *   - "Hacker News Top 300+"  — by-design sticky 300pt threshold filters
 *                                most stories, so empty windows are normal
 */
export const MIGRATION_013_SOURCES = [
  "Reddit r/worldnews",
  "Reddit r/geopolitics",
  "Reddit r/CredibleDefense",
  "Reddit r/cybersecurity",
  "Reddit r/netsec",
  "Reddit r/economy",
  "Reddit r/energy",
  "Reddit r/space",
  "Reddit r/MapPorn",
  // NOTE: This was originally "Hacker News Front Page" in migration 013.
  // It was renamed to "Hacker News" in commit b5b64a3 (HN alias for social
  // layer parity) without updating this tracking constant — causing the
  // signal-mix panel to permanently flag it as missing. Keep this name in
  // sync with whatever the feeds table actually contains.
  "Hacker News",
  "YouTube Reuters",
  "YouTube Al Jazeera English",
  "YouTube DW News",
  "YouTube BBC News",
  "YouTube Bloomberg",
  "YouTube FRANCE 24 English",
  "Bluesky What's Hot",
] as const;

/** Threshold: below this % of T4 events, the social layer is under-contributing */
const SOCIAL_LAYER_MIN_PCT = 3;

/** Threshold: one source dominates more than this % → imbalance */
const MAX_SINGLE_SOURCE_PCT = 25;

/**
 * Analyze source hits and produce a full mix report.
 * Pure function — no I/O. All data comes from the `hits` parameter.
 */
export function analyzeSignalMix(
  hits: SourceHit[],
  windowHours: number = 24
): SignalMixReport {
  const totalEvents = hits.reduce((sum, h) => sum + h.count, 0);
  const totalSources = hits.length;

  // Look up reliability tier for every source in one batch
  const sourceNames = hits.map((h) => h.source);
  const reliabilityMap = getBulkReliability(sourceNames);

  // Group events by tier
  const tierBuckets: Record<string, { events: number; sources: Set<string> }> = {
    "1": { events: 0, sources: new Set() },
    "2": { events: 0, sources: new Set() },
    "3": { events: 0, sources: new Set() },
    "4": { events: 0, sources: new Set() },
    unknown: { events: 0, sources: new Set() },
  };

  for (const hit of hits) {
    const rel = reliabilityMap.get(hit.source);
    const tier = rel ? String(rel.tier) : "unknown";
    tierBuckets[tier].events += hit.count;
    tierBuckets[tier].sources.add(hit.source);
  }

  const tierDistribution: TierDistribution[] = (
    ["1", "2", "3", "4", "unknown"] as const
  ).map((tier) => ({
    tier: tier === "unknown" ? "unknown" : (Number(tier) as 1 | 2 | 3 | 4),
    events: tierBuckets[tier].events,
    sourceCount: tierBuckets[tier].sources.size,
    percentage:
      totalEvents > 0
        ? Math.round((tierBuckets[tier].events / totalEvents) * 1000) / 10
        : 0,
  }));

  const socialLayerPct = tierDistribution.find((t) => t.tier === 4)?.percentage ?? 0;

  // Top 10 sources by event count
  const topSources = [...hits]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Status of migration 013 sources
  const hitMap = new Map(hits.map((h) => [h.source, h.count]));
  const newSourceStatus = MIGRATION_013_SOURCES.map((source) => {
    const count = hitMap.get(source);
    if (count === undefined) {
      return { source, status: "missing" as const, eventCount: 0 };
    }
    if (count === 0) {
      return { source, status: "zero-events" as const, eventCount: 0 };
    }
    return { source, status: "healthy" as const, eventCount: count };
  });

  // Detect anomalies
  const anomalies: SignalAnomaly[] = [];

  if (totalEvents === 0) {
    anomalies.push({
      severity: "critical",
      code: "NO_EVENTS",
      message: `No events in the last ${windowHours} hours. Feed pipeline may be down.`,
    });
  } else {
    // Social layer under-contributing?
    if (socialLayerPct < SOCIAL_LAYER_MIN_PCT) {
      anomalies.push({
        severity: "warning",
        code: "SOCIAL_LAYER_UNDERCONTRIBUTING",
        message: `T4 social/community layer is only ${socialLayerPct}% of events (threshold: ${SOCIAL_LAYER_MIN_PCT}%). Convergence cross-tier bonus won't activate.`,
        metric: socialLayerPct,
      });
    }

    // Single source dominating?
    const topSource = topSources[0];
    if (topSource && totalEvents > 0) {
      const topPct = (topSource.count / totalEvents) * 100;
      if (topPct > MAX_SINGLE_SOURCE_PCT) {
        anomalies.push({
          severity: "warning",
          code: "TIER_IMBALANCE",
          message: `Source "${topSource.source}" produces ${topPct.toFixed(1)}% of all events (threshold: ${MAX_SINGLE_SOURCE_PCT}%). Review for flood or dedup bug.`,
          sources: [topSource.source],
          metric: Math.round(topPct * 10) / 10,
        });
      }
    }

    // New sources with zero events?
    const zeroEventNewSources = newSourceStatus
      .filter((s) => s.status === "zero-events" || s.status === "missing")
      .map((s) => s.source);

    if (zeroEventNewSources.length > 0) {
      anomalies.push({
        severity: zeroEventNewSources.length >= 5 ? "critical" : "warning",
        code: "NEW_SOURCE_ZERO_EVENTS",
        message: `${zeroEventNewSources.length} of ${MIGRATION_013_SOURCES.length} migration-013 sources have zero events in window. May be broken or rate-limited.`,
        sources: zeroEventNewSources,
        metric: zeroEventNewSources.length,
      });
    }
  }

  return {
    windowHours,
    totalEvents,
    totalSources,
    tierDistribution,
    topSources,
    newSourceStatus,
    anomalies,
    socialLayerPct,
  };
}

/**
 * Render a signal mix report as plain text — used by the Telegram alert cron.
 * Keeps formatting simple so it looks right in Telegram even without HTML.
 */
export function renderSignalMixForTelegram(report: SignalMixReport): string {
  const lines: string[] = [];
  lines.push(`🧭 <b>WorldScope Signal Mix</b> — last ${report.windowHours}h`);
  lines.push("");
  lines.push(`📊 ${report.totalEvents} events across ${report.totalSources} sources`);
  lines.push("");

  lines.push("<b>Tier distribution:</b>");
  for (const t of report.tierDistribution) {
    if (t.events === 0) continue;
    const tierLabel = t.tier === "unknown" ? "T?" : `T${t.tier}`;
    lines.push(`  ${tierLabel}: ${t.events} events (${t.percentage}%) — ${t.sourceCount} sources`);
  }
  lines.push("");

  if (report.anomalies.length === 0) {
    lines.push("✅ No anomalies detected.");
  } else {
    lines.push(`⚠️ <b>${report.anomalies.length} anomal${report.anomalies.length === 1 ? "y" : "ies"} detected:</b>`);
    for (const a of report.anomalies) {
      const icon = a.severity === "critical" ? "🔴" : "🟡";
      lines.push(`${icon} ${a.message}`);
    }
  }

  return lines.join("\n");
}
