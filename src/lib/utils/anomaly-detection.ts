import type { IntelItem, Category, Severity } from "@/types/intel";

export interface Anomaly {
  type: "spike" | "new_source" | "severity_shift" | "geo_cluster";
  description: string;
  severity: Severity;
  category?: Category;
  score: number; // 0-100
}

/**
 * Detect anomalies in event stream using statistical methods.
 * Compares current period vs historical baseline.
 */
export function detectAnomalies(
  items: IntelItem[],
  baselineHours = 24,
  currentWindowHours = 6
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const now = Date.now();
  const currentCutoff = now - currentWindowHours * 60 * 60 * 1000;
  const baselineCutoff = now - baselineHours * 60 * 60 * 1000;

  const current = items.filter((i) => new Date(i.publishedAt).getTime() >= currentCutoff);
  const baseline = items.filter((i) => {
    const t = new Date(i.publishedAt).getTime();
    return t >= baselineCutoff && t < currentCutoff;
  });

  if (baseline.length === 0 || current.length === 0) return anomalies;

  // ── Category spike detection (z-score > 2) ──
  const baseCatCounts = countBy(baseline, "category");
  const curCatCounts = countBy(current, "category");
  const baselineRatio = currentWindowHours / (baselineHours - currentWindowHours);

  for (const [cat, curCount] of Object.entries(curCatCounts)) {
    const expectedCount = (baseCatCounts[cat] || 0) * baselineRatio;
    const deviation = expectedCount > 0 ? (curCount - expectedCount) / Math.max(expectedCount, 1) : curCount > 2 ? 1 : 0;

    if (deviation > 1 && curCount >= 3) {
      anomalies.push({
        type: "spike",
        description: `${cat} events spiked ${Math.round(deviation * 100)}% above baseline (${curCount} vs expected ${Math.round(expectedCount)})`,
        severity: deviation > 3 ? "critical" : deviation > 2 ? "high" : "medium",
        category: cat as Category,
        score: Math.min(100, Math.round(deviation * 30)),
      });
    }
  }

  // ── Severity escalation ──
  const baseSevDist = countBy(baseline, "severity");
  const curSevDist = countBy(current, "severity");
  const baseCritRate = baseline.length > 0
    ? ((baseSevDist["critical"] || 0) + (baseSevDist["high"] || 0)) / baseline.length
    : 0;
  const curCritRate = current.length > 0
    ? ((curSevDist["critical"] || 0) + (curSevDist["high"] || 0)) / current.length
    : 0;

  if (curCritRate > baseCritRate + 0.15 && current.length >= 5) {
    anomalies.push({
      type: "severity_shift",
      description: `Critical/High rate increased from ${Math.round(baseCritRate * 100)}% to ${Math.round(curCritRate * 100)}%`,
      severity: curCritRate > 0.5 ? "critical" : "high",
      score: Math.min(100, Math.round((curCritRate - baseCritRate) * 200)),
    });
  }

  // ── Geographic cluster detection ──
  const geoGrid: Record<string, number> = {};
  current.forEach((i) => {
    if (i.lat != null && i.lng != null) {
      const key = `${Math.round(i.lat / 5) * 5},${Math.round(i.lng / 5) * 5}`;
      geoGrid[key] = (geoGrid[key] || 0) + 1;
    }
  });

  for (const [coords, count] of Object.entries(geoGrid)) {
    if (count >= 5) {
      anomalies.push({
        type: "geo_cluster",
        description: `${count} events clustered near ${coords}°`,
        severity: count >= 10 ? "high" : "medium",
        score: Math.min(100, count * 8),
      });
    }
  }

  return anomalies.sort((a, b) => b.score - a.score).slice(0, 10);
}

function countBy(items: IntelItem[], key: keyof IntelItem): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const val = String(item[key]);
    counts[val] = (counts[val] || 0) + 1;
  }
  return counts;
}
