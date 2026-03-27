/**
 * Cross-stream correlation engine
 * Detects multi-signal patterns across intel categories and geographies.
 */

import type { IntelItem, Category } from "@/types/intel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Correlation {
  type: string;
  countries: string[];
  confidence: number;
  description: string;
  items: { id: string; title: string; category: string }[];
  detectedAt: string;
}

interface CorrelationPattern {
  type: string;
  /** First signal filter */
  categoryA: Category;
  /** Second signal filter */
  categoryB: Category;
  /** Maximum time gap between matched items (ms) */
  windowMs: number;
  /** Match within same country ("country") or same region ("region") */
  scope: "country" | "region";
  /** Human-readable description template. {countries} is replaced at runtime. */
  descriptionTemplate: string;
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

const PATTERNS: CorrelationPattern[] = [
  {
    type: "MILITARY_ECONOMIC",
    categoryA: "conflict",
    categoryB: "finance",
    windowMs: 48 * 3_600_000,
    scope: "country",
    descriptionTemplate:
      "Military conflict and economic instability signals detected in {countries} within 48 h",
  },
  {
    type: "HEALTH_DIPLOMACY",
    categoryA: "health",
    categoryB: "diplomacy",
    windowMs: 72 * 3_600_000,
    scope: "region",
    descriptionTemplate:
      "Health alert and diplomatic activity correlated in {countries} within 72 h",
  },
  {
    type: "CYBER_INFRASTRUCTURE",
    categoryA: "cyber",
    categoryB: "energy",
    windowMs: 24 * 3_600_000,
    scope: "country",
    descriptionTemplate:
      "Cyber threat and energy / infrastructure disruption in {countries} within 24 h",
  },
  {
    type: "PROTEST_RESPONSE",
    categoryA: "protest",
    categoryB: "diplomacy",
    windowMs: 48 * 3_600_000,
    scope: "country",
    descriptionTemplate:
      "Protest activity followed by diplomatic response in {countries} within 48 h",
  },
];

// ---------------------------------------------------------------------------
// Region mapping (simple lookup from COUNTRIES config — inlined to avoid
// a runtime dependency on the full config array for this utility module)
// ---------------------------------------------------------------------------

/** Best-effort region mapping for correlation.
 *  Uses the first two characters of the country code as a fallback "region". */
const REGION_MAP: Record<string, string> = {
  // Middle East
  TR: "Middle East", IL: "Middle East", IR: "Middle East", IQ: "Middle East",
  SY: "Middle East", SA: "Middle East", AE: "Middle East", YE: "Middle East",
  LB: "Middle East",
  // Europe
  UA: "Europe", RU: "Europe", DE: "Europe", FR: "Europe", GB: "Europe",
  PL: "Europe", IT: "Europe",
  // Asia
  CN: "Asia", JP: "Asia", KR: "Asia", KP: "Asia", IN: "Asia", PK: "Asia",
  TW: "Asia", AF: "Asia", MM: "Asia",
  // Americas
  US: "Americas", BR: "Americas", MX: "Americas", CO: "Americas", VE: "Americas",
  // Africa
  NG: "Africa", EG: "Africa", SD: "Africa", ET: "Africa", SO: "Africa",
  CD: "Africa", ZA: "Africa",
};

function getRegion(countryCode: string): string {
  return REGION_MAP[countryCode] ?? countryCode.slice(0, 2);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toRef(item: IntelItem): { id: string; title: string; category: string } {
  return { id: item.id, title: item.title, category: item.category };
}

function timestamp(item: IntelItem): number {
  return new Date(item.publishedAt).getTime();
}

/**
 * Confidence is calculated from:
 * - count of matched pairs (more pairs = higher)
 * - severity overlap (critical items boost confidence)
 * - time proximity (closer = higher)
 */
function computeConfidence(
  matchedA: IntelItem[],
  matchedB: IntelItem[],
  windowMs: number,
): number {
  const pairCount = Math.min(matchedA.length, matchedB.length);
  const countFactor = Math.min(pairCount / 5, 1); // saturates at 5 pairs

  // Average severity boost
  const severityWeight: Record<string, number> = {
    critical: 1.0, high: 0.7, medium: 0.4, low: 0.2, info: 0.1,
  };
  const allItems = [...matchedA, ...matchedB];
  const avgSeverity =
    allItems.reduce((s, i) => s + (severityWeight[i.severity] ?? 0), 0) /
    Math.max(allItems.length, 1);

  // Temporal proximity: shortest gap between any A/B pair
  let minGap = windowMs;
  for (const a of matchedA) {
    for (const b of matchedB) {
      const gap = Math.abs(timestamp(a) - timestamp(b));
      if (gap < minGap) minGap = gap;
    }
  }
  const proximityFactor = 1 - minGap / windowMs;

  const raw = 0.4 * countFactor + 0.3 * avgSeverity + 0.3 * proximityFactor;
  return Math.round(Math.min(Math.max(raw, 0), 1) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Core matching
// ---------------------------------------------------------------------------

function matchPattern(
  pattern: CorrelationPattern,
  items: IntelItem[],
): Correlation[] {
  const catAItems = items.filter((i) => i.category === pattern.categoryA && i.countryCode);
  const catBItems = items.filter((i) => i.category === pattern.categoryB && i.countryCode);

  if (catAItems.length === 0 || catBItems.length === 0) return [];

  // Group by key (country code or region)
  const keyFn =
    pattern.scope === "country"
      ? (code: string) => code
      : (code: string) => getRegion(code);

  const groupA = new Map<string, IntelItem[]>();
  for (const item of catAItems) {
    const key = keyFn(item.countryCode!);
    const list = groupA.get(key);
    if (list) list.push(item);
    else groupA.set(key, [item]);
  }

  const groupB = new Map<string, IntelItem[]>();
  for (const item of catBItems) {
    const key = keyFn(item.countryCode!);
    const list = groupB.get(key);
    if (list) list.push(item);
    else groupB.set(key, [item]);
  }

  const correlations: Correlation[] = [];

  for (const [key, aItems] of groupA) {
    const bItems = groupB.get(key);
    if (!bItems) continue;

    // Sliding window check: at least one A/B pair within the window
    const matchedA: IntelItem[] = [];
    const matchedB: IntelItem[] = [];

    for (const a of aItems) {
      for (const b of bItems) {
        if (Math.abs(timestamp(a) - timestamp(b)) <= pattern.windowMs) {
          if (!matchedA.includes(a)) matchedA.push(a);
          if (!matchedB.includes(b)) matchedB.push(b);
        }
      }
    }

    if (matchedA.length === 0 || matchedB.length === 0) continue;

    // Collect unique country codes involved
    const countryCodes = new Set<string>();
    for (const i of [...matchedA, ...matchedB]) {
      if (i.countryCode) countryCodes.add(i.countryCode);
    }

    const countries = Array.from(countryCodes);
    const confidence = computeConfidence(matchedA, matchedB, pattern.windowMs);
    const description = pattern.descriptionTemplate.replace(
      "{countries}",
      countries.join(", "),
    );

    correlations.push({
      type: pattern.type,
      countries,
      confidence,
      description,
      items: [...matchedA.map(toRef), ...matchedB.map(toRef)],
      detectedAt: new Date().toISOString(),
    });
  }

  return correlations;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect cross-stream correlations across the supplied intel items.
 *
 * @param items  Array of IntelItem (typically the latest feed snapshot)
 * @returns      Array of detected correlations sorted by confidence (desc)
 */
export function detectCorrelations(items: IntelItem[]): Correlation[] {
  const all: Correlation[] = [];

  for (const pattern of PATTERNS) {
    const matches = matchPattern(pattern, items);
    all.push(...matches);
  }

  // Sort by confidence descending
  all.sort((a, b) => b.confidence - a.confidence);

  return all;
}
