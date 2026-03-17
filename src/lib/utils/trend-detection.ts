import type { IntelItem, Category } from "@/types/intel";

export interface TrendData {
  /** Categories with increased activity vs previous period */
  risingCategories: Array<{
    category: Category;
    current: number;
    previous: number;
    changePct: number;
  }>;
  /** Severity escalation — more critical/high events than before */
  severityEscalation: {
    currentCriticalPct: number;
    previousCriticalPct: number;
    escalating: boolean;
  };
  /** New sources not seen in previous period */
  newSources: string[];
  /** Regions with sudden activity spike */
  hotRegions: Array<{
    label: string;
    count: number;
  }>;
}

/**
 * Compare current period events vs previous period to detect trends.
 * Default: last 12h vs 12-24h ago.
 */
export function detectTrends(
  items: IntelItem[],
  periodHours = 12
): TrendData {
  const now = Date.now();
  const cutoff = now - periodHours * 60 * 60 * 1000;
  const prevCutoff = cutoff - periodHours * 60 * 60 * 1000;

  const current = items.filter(
    (i) => new Date(i.publishedAt).getTime() >= cutoff
  );
  const previous = items.filter((i) => {
    const t = new Date(i.publishedAt).getTime();
    return t >= prevCutoff && t < cutoff;
  });

  // Category trends
  const curCats = countBy(current, "category");
  const prevCats = countBy(previous, "category");
  const allCats = new Set([...Object.keys(curCats), ...Object.keys(prevCats)]);

  const risingCategories = [...allCats]
    .map((cat) => {
      const cur = curCats[cat] || 0;
      const prev = prevCats[cat] || 0;
      const changePct = prev > 0 ? ((cur - prev) / prev) * 100 : cur > 0 ? 100 : 0;
      return { category: cat as Category, current: cur, previous: prev, changePct };
    })
    .filter((t) => t.changePct > 20 && t.current >= 2)
    .sort((a, b) => b.changePct - a.changePct);

  // Severity escalation
  const curCriticalPct = current.length > 0
    ? current.filter((i) => i.severity === "critical" || i.severity === "high").length / current.length
    : 0;
  const prevCriticalPct = previous.length > 0
    ? previous.filter((i) => i.severity === "critical" || i.severity === "high").length / previous.length
    : 0;

  // New sources
  const prevSources = new Set(previous.map((i) => i.source));
  const newSources = [...new Set(current.map((i) => i.source))]
    .filter((s) => !prevSources.has(s));

  // Hot regions (rough geo-binning by 10° grid)
  const regionBins: Record<string, number> = {};
  current.forEach((i) => {
    if (i.lat != null && i.lng != null) {
      const latBin = Math.round(i.lat / 10) * 10;
      const lngBin = Math.round(i.lng / 10) * 10;
      const label = `${latBin}°${latBin >= 0 ? "N" : "S"}, ${Math.abs(lngBin)}°${lngBin >= 0 ? "E" : "W"}`;
      regionBins[label] = (regionBins[label] || 0) + 1;
    }
  });

  const hotRegions = Object.entries(regionBins)
    .map(([label, count]) => ({ label, count }))
    .filter((r) => r.count >= 3)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    risingCategories,
    severityEscalation: {
      currentCriticalPct: Math.round(curCriticalPct * 100),
      previousCriticalPct: Math.round(prevCriticalPct * 100),
      escalating: curCriticalPct > prevCriticalPct + 0.1,
    },
    newSources,
    hotRegions,
  };
}

function countBy(items: IntelItem[], key: keyof IntelItem): Record<string, number> {
  const counts: Record<string, number> = {};
  items.forEach((item) => {
    const val = String(item[key]);
    counts[val] = (counts[val] || 0) + 1;
  });
  return counts;
}
