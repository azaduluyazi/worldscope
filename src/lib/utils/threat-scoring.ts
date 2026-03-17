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

export function calculateThreatIndex(events: EventInput[]): ThreatResult {
  if (events.length === 0) {
    return { score: 0, level: "low", categories: {} };
  }

  const categories: Record<string, number> = {};
  let rawScore = 0;

  for (const event of events) {
    rawScore += SEVERITY_WEIGHTS[event.severity];
    categories[event.category] = (categories[event.category] || 0) + SEVERITY_WEIGHTS[event.severity];
  }

  const score = Math.min(100, Math.round((rawScore / 200) * 100));

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
