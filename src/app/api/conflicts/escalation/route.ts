import { NextResponse } from "next/server";
import { cachedFetch, TTL } from "@/lib/cache/redis";
import { fetchPersistedEvents } from "@/lib/db/events";
import { detectConflictZones } from "@/lib/conflicts/escalation-detector";
import type { ConflictZone } from "@/lib/conflicts/escalation-detector";

export const runtime = "nodejs";

/**
 * GET /api/conflicts/escalation
 * Returns detected conflict zones with escalation scores.
 * Fetches last 7 days of conflict events, scores them, caches for 15 minutes.
 */
export async function GET() {
  try {
    const data = await cachedFetch(
      "conflicts:escalation",
      async () => {
        // Fetch 7 days of events, focusing on conflict/protest/diplomacy
        const items = await fetchPersistedEvents({
          limit: 2000,
          hoursBack: 168, // 7 days
        });

        const zones = detectConflictZones(items);

        // Strip full event objects from response to reduce payload
        const slimZones: Omit<ConflictZone, "events">[] = zones.map(
          ({ events: _events, ...zone }) => ({
            ...zone,
            eventCount: _events.length,
          })
        );

        return {
          zones: slimZones,
          totalConflicts: zones.length,
          escalatingCount: zones.filter((z) => z.trend === "escalating").length,
          deescalatingCount: zones.filter((z) => z.trend === "de-escalating").length,
          stableCount: zones.filter((z) => z.trend === "stable").length,
          timestamp: new Date().toISOString(),
        };
      },
      TTL.MEDIUM * 3 // 15 minutes (5 min tier * 3)
    );

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      zones: [],
      totalConflicts: 0,
      escalatingCount: 0,
      deescalatingCount: 0,
      stableCount: 0,
      timestamp: new Date().toISOString(),
    });
  }
}
