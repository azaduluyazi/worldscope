import { redis } from "@/lib/cache/redis";
import type { IntelItem } from "@/types/intel";

interface BaselineSnapshot {
  timestamp: string;
  categoryDistribution: Record<string, number>;
  severityDistribution: Record<string, number>;
  totalCount: number;
  topRegions: Array<{ key: string; count: number }>;
}

/**
 * Record a baseline snapshot of current intel state.
 * Stored in Redis with 48h TTL — rolls automatically.
 */
export async function recordBaseline(items: IntelItem[]): Promise<void> {
  const snapshot: BaselineSnapshot = {
    timestamp: new Date().toISOString(),
    categoryDistribution: countBy(items, "category"),
    severityDistribution: countBy(items, "severity"),
    totalCount: items.length,
    topRegions: computeRegions(items),
  };

  const key = `baseline:${Date.now()}`;
  await redis.set(key, JSON.stringify(snapshot), { ex: 48 * 3600 });
  await redis.set("baseline:latest", JSON.stringify(snapshot), { ex: 48 * 3600 });
}

export async function getLatestBaseline(): Promise<BaselineSnapshot | null> {
  const data = await redis.get<string>("baseline:latest");
  return data ? JSON.parse(data) : null;
}

function countBy(items: IntelItem[], key: keyof IntelItem): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const val = String(item[key]);
    counts[val] = (counts[val] || 0) + 1;
  }
  return counts;
}

function computeRegions(items: IntelItem[]): Array<{ key: string; count: number }> {
  const grid: Record<string, number> = {};
  for (const item of items) {
    if (item.lat != null && item.lng != null) {
      const key = `${Math.round(item.lat / 10) * 10},${Math.round(item.lng / 10) * 10}`;
      grid[key] = (grid[key] || 0) + 1;
    }
  }
  return Object.entries(grid)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
