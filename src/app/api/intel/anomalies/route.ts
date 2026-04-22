import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchPersistedEvents } from "@/lib/db/events";
import { detectAnomalies } from "@/lib/utils/anomaly-detection";
import { recordBaseline, getLatestBaseline } from "@/lib/db/baselines";
import { INTEL_KEYS } from "@/lib/cache/keys";

export const runtime = "nodejs";

/**
 * GET /api/intel/anomalies
 * Returns detected anomalies vs temporal baseline.
 * Automatically records new baseline snapshots.
 */
export async function GET() {
  try {
    const data = await cachedFetch(
      INTEL_KEYS.anomalies,
      async () => {
        const items = await fetchPersistedEvents({ limit: 1000, hoursBack: 48 });
        const anomalies = detectAnomalies(items, 24, 6);
        const baseline = await getLatestBaseline();

        // Record new baseline (Redis TTL handles cleanup)
        await recordBaseline(items).catch(() => {});

        return {
          anomalies,
          baseline: baseline ? {
            recordedAt: baseline.timestamp,
            totalEvents: baseline.totalCount,
            topCategories: baseline.categoryDistribution,
            topSeverities: baseline.severityDistribution,
            topRegions: baseline.topRegions,
          } : null,
          currentCount: items.length,
          timestamp: new Date().toISOString(),
        };
      },
      300 // 5 min cache
    );

    return NextResponse.json(data);
  } catch (err) {
    console.error("[intel/anomalies]", err);
    return NextResponse.json({
      anomalies: [],
      baseline: null,
      currentCount: 0,
      timestamp: new Date().toISOString(),
    });
  }
}
