import type { IntelItem, Severity, Category } from "@/types/intel";

export interface ImpactScore {
  score: number; // 0-100
  level: "critical" | "high" | "elevated" | "low";
  factors: {
    severity: number;     // 0-30 based on severity level
    sourceCount: number;  // 0-20 based on how many sources cover similar events
    geographic: number;   // 0-20 based on population/strategic importance
    recency: number;      // 0-15 based on how recent
    category: number;     // 0-15 based on category importance
  };
}

/* ── Severity factor (0-30) ── */
const SEVERITY_FACTOR: Record<Severity, number> = {
  critical: 30,
  high: 22,
  medium: 14,
  low: 6,
  info: 0,
};

/* ── Category importance (0-15) ── */
const CATEGORY_FACTOR: Record<Category, number> = {
  conflict: 15,
  cyber: 15,
  finance: 12,
  energy: 12,
  natural: 10,
  health: 10,
  aviation: 10,
  diplomacy: 8,
  protest: 8,
  tech: 8,
  sports: 8,
};

/* ── Strategic country tiers for geographic factor ── */
const TIER1_COUNTRIES = new Set([
  "US", "CN", "RU", "UK", "GB", "DE", "JP", "FR", "IN",
]);
const TIER2_COUNTRIES = new Set([
  "KR", "BR", "IL", "IR", "SA", "TR", "AU", "CA", "IT",
  "PK", "EG", "UA", "TW", "PL", "NL", "SE", "NO",
]);

/**
 * Compute word-overlap ratio between two titles.
 * Returns 0-1 where >0.5 means likely about the same event.
 */
function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(
    a.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 3)
  );
  const wordsB = new Set(
    b.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 3)
  );
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  const minSize = Math.min(wordsA.size, wordsB.size);
  return minSize > 0 ? overlap / minSize : 0;
}

/**
 * Calculate multi-factor impact score (0-100) for an event.
 * Factors: severity, source count, geographic importance, recency, category.
 */
export function calculateImpactScore(
  item: IntelItem,
  allItems?: IntelItem[]
): ImpactScore {
  // ── Severity factor (0-30) ──
  const severity = SEVERITY_FACTOR[item.severity] ?? 0;

  // ── Source count factor (0-20) ──
  // Count items with similar title (word overlap > 50%) as corroborating sources
  let sourceCount = 0;
  if (allItems && allItems.length > 0) {
    let similarCount = 0;
    for (const other of allItems) {
      if (other.id === item.id) continue;
      if (wordOverlap(item.title, other.title) > 0.5) {
        similarCount++;
      }
    }
    sourceCount = Math.min(20, similarCount * 5);
  }

  // ── Geographic factor (0-20) ──
  let geographic = 10; // default for unknown or no country
  if (item.countryCode) {
    const code = item.countryCode.toUpperCase();
    if (TIER1_COUNTRIES.has(code)) {
      geographic = 20;
    } else if (TIER2_COUNTRIES.has(code)) {
      geographic = 15;
    }
  }

  // ── Recency factor (0-15) ──
  const ageMs = Date.now() - new Date(item.publishedAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  let recency: number;
  if (ageHours <= 1) recency = 15;
  else if (ageHours <= 3) recency = 12;
  else if (ageHours <= 6) recency = 9;
  else if (ageHours <= 12) recency = 6;
  else if (ageHours <= 24) recency = 3;
  else recency = 0;

  // ── Category factor (0-15) ──
  const category = CATEGORY_FACTOR[item.category] ?? 8;

  // ── Composite score ──
  const score = Math.min(100, severity + sourceCount + geographic + recency + category);

  // ── Level thresholds ──
  let level: ImpactScore["level"];
  if (score >= 75) level = "critical";
  else if (score >= 50) level = "high";
  else if (score >= 25) level = "elevated";
  else level = "low";

  return {
    score,
    level,
    factors: { severity, sourceCount, geographic, recency, category },
  };
}
