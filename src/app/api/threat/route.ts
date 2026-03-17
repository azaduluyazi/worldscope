import { NextResponse } from "next/server";
import { cachedFetch, TTL } from "@/lib/cache/redis";
import { calculateThreatIndex } from "@/lib/utils/threat-scoring";
import { detectTrends } from "@/lib/utils/trend-detection";
import type { IntelItem } from "@/types/intel";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const baseUrl = new URL(request.url).origin;

    const result = await cachedFetch(
      "threat:index:v2",
      async () => {
        const res = await fetch(`${baseUrl}/api/intel?limit=500`);
        if (!res.ok) {
          return { score: 0, level: "low" as const, categories: {}, trends: null };
        }

        const data = await res.json();
        const items = data.items as IntelItem[];

        const events = items.map((item) => ({
          severity: item.severity,
          category: item.category,
        }));

        const threat = calculateThreatIndex(events);
        const trends = detectTrends(items);

        return { ...threat, trends };
      },
      TTL.THREAT
    );

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { score: 0, level: "low", categories: {}, trends: null },
      { status: 500 }
    );
  }
}
