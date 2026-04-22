import { NextResponse } from "next/server";
import { cachedFetch, TTL } from "@/lib/cache/redis";
import { fetchPersistedEvents } from "@/lib/db/events";
import { detectAnomalies } from "@/lib/utils/anomaly-detection";
import { extractEntities } from "@/lib/utils/entity-extraction";
import { analyzeSentiment } from "@/lib/utils/sentiment-analysis";

export const runtime = "nodejs";

/** GET /api/intel/insights — ML-powered intelligence insights */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = Math.min(Math.max(Number(searchParams.get("hours") || 24), 1), 168);

    const insights = await cachedFetch(
      `intel:insights:${hours}`,
      async () => {
        const items = await fetchPersistedEvents({ limit: 300, hoursBack: hours });

        const anomalies = detectAnomalies(items, hours, Math.min(hours / 4, 12));
        const entities = extractEntities(items, 20);
        const sentiment = analyzeSentiment(items);

        return {
          anomalies,
          entities,
          sentiment,
          meta: {
            analyzedEvents: items.length,
            timeRangeHours: hours,
            generatedAt: new Date().toISOString(),
          },
        };
      },
      TTL.NEWS // 600s cache
    );

    return NextResponse.json(insights);
  } catch (err) {
    console.error("[intel/insights]", err);
    return NextResponse.json(
      { anomalies: [], entities: [], sentiment: null, meta: { analyzedEvents: 0 } },
      { status: 500 }
    );
  }
}
