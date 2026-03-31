import { NextResponse } from "next/server";
import { cachedFetch, TTL } from "@/lib/cache/redis";
import { fetchPersistedEvents } from "@/lib/db/events";
import { buildRelationshipGraph } from "@/lib/geo/relationship-builder";
import type { RelationshipGraph } from "@/lib/geo/relationship-builder";

export const dynamic = "force-dynamic";

/**
 * GET /api/geo/relationships
 *
 * Returns a force-directed relationship graph built from the last
 * 7 days of persisted events. Cached in Redis for 30 minutes.
 */
export async function GET() {
  try {
    const graph = await cachedFetch<RelationshipGraph>(
      "geo:relationships:7d",
      async () => {
        const items = await fetchPersistedEvents({
          hoursBack: 7 * 24, // 7 days
          limit: 5000,
        });
        return buildRelationshipGraph(items);
      },
      TTL.MEDIUM * 6 // 30 minutes (300s * 6)
    );

    return NextResponse.json(graph);
  } catch (err) {
    console.error("[geo/relationships] Error:", err);
    return NextResponse.json(
      { nodes: [], edges: [], error: "Failed to build relationship graph" },
      { status: 500 }
    );
  }
}
