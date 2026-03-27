import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchPersistedEvents } from "@/lib/db/events";
import { detectCorrelations } from "@/lib/analytics/correlation";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await cachedFetch(
      "analytics:correlations",
      async () => {
        const items = await fetchPersistedEvents({ limit: 2000, hoursBack: 72 });
        return detectCorrelations(items);
      },
      600 // 10 min cache
    );
    return NextResponse.json({ correlations: data, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ correlations: [], timestamp: new Date().toISOString() });
  }
}
