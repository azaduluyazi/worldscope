import type { Severity, Category } from "@/types/intel";

interface EventInput {
  severity: Severity;
  category: Category;
}

interface ThreatResult {
  score: number;
  level: "critical" | "high" | "elevated" | "low";
  categories: Record<string, number>;
}

const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 10,
  high: 6,
  medium: 3,
  low: 1,
  info: 0,
};

/**
 * Calculate threat index based on severity DISTRIBUTION, not raw sum.
 * Prevents 200 "low" events from maxing out the score.
 * Score = weighted_avg/max_weight * 100 + volume_bonus + critical_bonus
 */
export function calculateThreatIndex(events: EventInput[]): ThreatResult {
  if (events.length === 0) {
    return { score: 0, level: "low", categories: {} };
  }

  const categories: Record<string, number> = {};
  let totalWeight = 0;
  let criticalCount = 0;

  for (const event of events) {
    const w = SEVERITY_WEIGHTS[event.severity];
    totalWeight += w;
    if (event.severity === "critical") criticalCount++;
    categories[event.category] = (categories[event.category] || 0) + w;
  }

  // Weighted average severity (0-10 scale) → base score (0-100)
  const weightedAvg = totalWeight / events.length;
  const baseScore = (weightedAvg / 10) * 100;

  // Volume bonus: more events = slightly higher (max +15)
  const volumeBonus = Math.min(15, Math.log2(Math.max(events.length, 1)) * 2);

  // Critical ratio bonus: >20% critical adds urgency (max +10)
  const criticalRatio = criticalCount / events.length;
  const criticalBonus = criticalRatio > 0.2 ? Math.min(10, criticalRatio * 30) : 0;

  const score = Math.min(100, Math.round(baseScore + volumeBonus + criticalBonus));

  // Normalize category scores to 0-100 relative to highest
  const maxCat = Math.max(...Object.values(categories), 1);
  for (const key of Object.keys(categories)) {
    categories[key] = Math.min(100, Math.round((categories[key] / maxCat) * 100));
  }

  let level: ThreatResult["level"];
  if (score >= 75) level = "critical";
  else if (score >= 50) level = "high";
  else if (score >= 25) level = "elevated";
  else level = "low";

  return { score, level, categories };
}
