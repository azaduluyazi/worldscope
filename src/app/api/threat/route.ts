import { NextResponse } from "next/server";
import { cachedFetch, TTL } from "@/lib/cache/redis";
import { calculateThreatIndex } from "@/lib/utils/threat-scoring";
import type { IntelItem } from "@/types/intel";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const baseUrl = new URL(request.url).origin;

    const threat = await cachedFetch(
      "threat:index",
      async () => {
        const res = await fetch(`${baseUrl}/api/intel`);
        if (!res.ok) return { score: 0, level: "low" as const, categories: {} };

        const data = await res.json();
        const events = (data.items as IntelItem[]).map((item) => ({
          severity: item.severity,
          category: item.category,
        }));

        return calculateThreatIndex(events);
      },
      TTL.THREAT
    );

    return NextResponse.json(threat);
  } catch {
    return NextResponse.json({ score: 0, level: "low", categories: {} }, { status: 500 });
  }
}
