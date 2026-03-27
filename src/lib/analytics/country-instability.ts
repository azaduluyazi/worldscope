/**
 * Country Instability Index (CII) Calculator
 * Produces a 0-100 risk score per country from real-time intel signals.
 */

import type { IntelItem, Category, Severity } from "@/types/intel";
import { COUNTRIES } from "@/config/countries";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CountryRisk {
  countryCode: string;
  countryName: string;
  score: number;
  signals: Record<string, number>;
  trend: "rising" | "stable" | "declining";
  severity: "critical" | "high" | "medium" | "low";
}

interface SignalDefinition {
  key: string;
  weight: number;
  evaluate: (items: IntelItem[], windowMs: number) => number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

const INFRASTRUCTURE_KEYWORDS = [
  "infrastructure",
  "bridge",
  "pipeline",
  "power grid",
  "dam",
  "water supply",
  "railway",
  "airport",
  "port",
  "telecom",
  "communication",
];

function countByCategory(items: IntelItem[], cat: Category): number {
  return items.filter((i) => i.category === cat).length;
}

function countByCategoryAndMinSeverity(
  items: IntelItem[],
  cat: Category,
  minSeverity: Severity,
): number {
  const minRank = SEVERITY_RANK[minSeverity];
  return items.filter(
    (i) => i.category === cat && SEVERITY_RANK[i.severity] >= minRank,
  ).length;
}

function countInfrastructureItems(items: IntelItem[]): number {
  return items.filter((i) => {
    const text = `${i.title} ${i.summary}`.toLowerCase();
    return INFRASTRUCTURE_KEYWORDS.some((kw) => text.includes(kw));
  }).length;
}

function uniqueCategories(items: IntelItem[]): number {
  return new Set(items.map((i) => i.category)).size;
}

/** Normalize a raw count to 0-1 using a sigmoid-like saturation curve. */
function saturate(value: number, halfPoint: number): number {
  if (value <= 0) return 0;
  return value / (value + halfPoint);
}

// ---------------------------------------------------------------------------
// Signal definitions
// ---------------------------------------------------------------------------

const SIGNALS: SignalDefinition[] = [
  {
    key: "conflict",
    weight: 0.15,
    evaluate: (items) => saturate(countByCategory(items, "conflict"), 5),
  },
  {
    key: "protest",
    weight: 0.10,
    evaluate: (items) => saturate(countByCategory(items, "protest"), 4),
  },
  {
    key: "fatality_severity",
    weight: 0.12,
    evaluate: (items) =>
      saturate(
        items.filter((i) => i.severity === "critical").length,
        3,
      ),
  },
  {
    key: "natural_disaster",
    weight: 0.08,
    evaluate: (items) => saturate(countByCategory(items, "natural"), 3),
  },
  {
    key: "economic_instability",
    weight: 0.10,
    evaluate: (items) =>
      saturate(countByCategoryAndMinSeverity(items, "finance", "medium"), 4),
  },
  {
    key: "cyber_threats",
    weight: 0.06,
    evaluate: (items) => saturate(countByCategory(items, "cyber"), 3),
  },
  {
    key: "health_alerts",
    weight: 0.06,
    evaluate: (items) => saturate(countByCategory(items, "health"), 3),
  },
  {
    key: "energy_disruption",
    weight: 0.05,
    evaluate: (items) => saturate(countByCategory(items, "energy"), 3),
  },
  {
    key: "diplomatic_tension",
    weight: 0.08,
    evaluate: (items) =>
      saturate(countByCategoryAndMinSeverity(items, "diplomacy", "high"), 3),
  },
  {
    key: "media_intensity",
    weight: 0.07,
    evaluate: (items, windowMs) => {
      const windowHours = Math.max(windowMs / 3_600_000, 1);
      const rate = items.length / windowHours;
      return saturate(rate, 10);
    },
  },
  {
    key: "infrastructure_risk",
    weight: 0.07,
    evaluate: (items) => saturate(countInfrastructureItems(items), 3),
  },
  {
    key: "cross_category_spread",
    weight: 0.06,
    evaluate: (items) => {
      const total = 11; // max possible distinct categories
      return Math.min(uniqueCategories(items) / total, 1);
    },
  },
];

// ---------------------------------------------------------------------------
// Trend detection
// ---------------------------------------------------------------------------

function detectTrend(
  items: IntelItem[],
  windowMs: number,
): "rising" | "stable" | "declining" {
  const midpoint = Date.now() - windowMs / 2;
  let older = 0;
  let newer = 0;
  for (const item of items) {
    const ts = new Date(item.publishedAt).getTime();
    if (ts < midpoint) older++;
    else newer++;
  }
  if (older === 0 && newer === 0) return "stable";
  const ratio = newer / Math.max(older, 1);
  if (ratio > 1.5) return "rising";
  if (ratio < 0.6) return "declining";
  return "stable";
}

function scoreSeverity(score: number): "critical" | "high" | "medium" | "low" {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

// ---------------------------------------------------------------------------
// Country name lookup
// ---------------------------------------------------------------------------

const countryNameMap = new Map<string, string>(
  COUNTRIES.map((c) => [c.code, c.name]),
);

function getCountryName(code: string): string {
  return countryNameMap.get(code) ?? code;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate the Country Instability Index for every country present in the
 * supplied intel items.
 *
 * @param items  Array of IntelItem (typically the latest feed snapshot)
 * @param windowMs  Time window in milliseconds (default 48 h)
 */
export function calculateCII(
  items: IntelItem[],
  windowMs: number = 48 * 3_600_000,
): CountryRisk[] {
  // Group items by country code (skip items without a code)
  const grouped = new Map<string, IntelItem[]>();
  for (const item of items) {
    const code = item.countryCode;
    if (!code) continue;
    const list = grouped.get(code);
    if (list) list.push(item);
    else grouped.set(code, [item]);
  }

  const results: CountryRisk[] = [];

  for (const [countryCode, countryItems] of grouped) {
    const signals: Record<string, number> = {};
    let weightedSum = 0;

    for (const signal of SIGNALS) {
      const raw = signal.evaluate(countryItems, windowMs);
      signals[signal.key] = Math.round(raw * 100) / 100;
      weightedSum += raw * signal.weight;
    }

    // weightedSum is in 0..1 (since weights sum to 1.0 and each signal is 0..1)
    const score = Math.round(Math.min(weightedSum * 100, 100));

    results.push({
      countryCode,
      countryName: getCountryName(countryCode),
      score,
      signals,
      trend: detectTrend(countryItems, windowMs),
      severity: scoreSeverity(score),
    });
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  return results;
}
