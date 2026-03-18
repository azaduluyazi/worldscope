"use client";

import { useMemo } from "react";
import useSWR from "swr";
import type { IntelFeedResponse, IntelItem, Severity } from "@/types/intel";
import { detectTrends } from "@/lib/utils/trend-detection";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export type TimeRange = 6 | 24 | 168 | 720; // hours

export interface SeverityBucket {
  label: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface CategoryCount {
  category: string;
  count: number;
  icon: string;
}

export interface SourceCount {
  source: string;
  count: number;
}

export interface GeoHotspot {
  region: string;
  count: number;
  topSeverity: Severity;
}

export interface AnalyticsData {
  items: IntelItem[];
  totalEvents: number;
  uniqueSources: number;
  uniqueRegions: number;
  geoRate: number;
  avgPerHour: number;
  severityBuckets: SeverityBucket[];
  categoryCounts: CategoryCount[];
  topSources: SourceCount[];
  geoHotspots: GeoHotspot[];
  trends: ReturnType<typeof detectTrends>;
}

const CATEGORY_ICONS: Record<string, string> = {
  conflict: "⚔️", finance: "📊", cyber: "🛡️", tech: "💻", natural: "🌍",
  aviation: "✈️", energy: "⚡", diplomacy: "🏛️", protest: "📢", health: "🏥",
};

function computeAnalytics(items: IntelItem[], hours: TimeRange): AnalyticsData {
  const now = Date.now();
  const totalEvents = items.length;

  // Unique sources
  const sourceMap: Record<string, number> = {};
  const catMap: Record<string, number> = {};
  const regionMap: Record<string, { count: number; topSev: number }> = {};
  let geoCount = 0;

  const sevWeights: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

  for (const item of items) {
    sourceMap[item.source] = (sourceMap[item.source] || 0) + 1;
    catMap[item.category] = (catMap[item.category] || 0) + 1;

    if (item.lat != null && item.lng != null) {
      geoCount++;
      const regionKey = `${Math.round(item.lat / 10) * 10},${Math.round(item.lng / 10) * 10}`;
      if (!regionMap[regionKey]) regionMap[regionKey] = { count: 0, topSev: 4 };
      regionMap[regionKey].count++;
      const sevIdx = sevWeights[item.severity] ?? 4;
      if (sevIdx < regionMap[regionKey].topSev) regionMap[regionKey].topSev = sevIdx;
    }
  }

  // Severity trend buckets
  const bucketCount = Math.min(12, Math.max(4, Math.floor(hours / 2)));
  const bucketSizeMs = (hours * 60 * 60 * 1000) / bucketCount;
  const severityBuckets: SeverityBucket[] = Array.from({ length: bucketCount }, (_, i) => {
    const hoursAgo = Math.round(((bucketCount - 1 - i) * hours) / bucketCount);
    return {
      label: hoursAgo === 0 ? "now" : `${hoursAgo}h`,
      critical: 0, high: 0, medium: 0, low: 0, info: 0,
    };
  });

  for (const item of items) {
    const ageMs = now - new Date(item.publishedAt).getTime();
    const idx = Math.min(bucketCount - 1, Math.max(0, Math.floor(ageMs / bucketSizeMs)));
    const bucketIdx = bucketCount - 1 - idx; // reverse so newest is last
    const b = severityBuckets[bucketIdx];
    switch (item.severity) {
      case "critical": b.critical++; break;
      case "high": b.high++; break;
      case "medium": b.medium++; break;
      case "low": b.low++; break;
      case "info": b.info++; break;
    }
  }

  // Category counts sorted
  const categoryCounts: CategoryCount[] = Object.entries(catMap)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, count]) => ({
      category: cat,
      count,
      icon: CATEGORY_ICONS[cat] || "📌",
    }));

  // Top sources
  const topSources: SourceCount[] = Object.entries(sourceMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([source, count]) => ({ source, count }));

  // Geo hotspots
  const sevNames: Severity[] = ["critical", "high", "medium", "low", "info"];
  const geoHotspots: GeoHotspot[] = Object.entries(regionMap)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 8)
    .map(([region, data]) => ({
      region: `${region}°`,
      count: data.count,
      topSeverity: sevNames[data.topSev] || "info",
    }));

  // Trends (reuse existing util)
  const trends = detectTrends(items);

  return {
    items,
    totalEvents,
    uniqueSources: Object.keys(sourceMap).length,
    uniqueRegions: Object.keys(regionMap).length,
    geoRate: totalEvents > 0 ? Math.round((geoCount / totalEvents) * 100) : 0,
    avgPerHour: totalEvents > 0 ? Math.round((totalEvents / hours) * 10) / 10 : 0,
    severityBuckets,
    categoryCounts,
    topSources,
    geoHotspots,
    trends,
  };
}

export function useAnalytics(hours: TimeRange) {
  const { data, error, isLoading } = useSWR<IntelFeedResponse>(
    `/api/intel?hours=${hours}&limit=500`,
    fetcher,
    {
      refreshInterval: 120_000,
      revalidateOnFocus: true,
      dedupingInterval: 60_000,
    }
  );

  const analytics = useMemo(
    () => computeAnalytics(data?.items || [], hours),
    [data?.items, hours]
  );

  return {
    ...analytics,
    isLoading,
    isError: !!error,
  };
}

// Export for testing
export { computeAnalytics };
