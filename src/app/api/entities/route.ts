import { NextRequest, NextResponse } from "next/server";
import { fetchPersistedEvents } from "@/lib/db/events";
import { extractBulkEntities } from "@/lib/nlp/entity-extraction";

export const revalidate = 300; // 5 min cache

/**
 * GET /api/entities — Extract and rank entities from recent intelligence events.
 *
 * Returns trending people, organizations, countries, and topics
 * extracted via NER from the last N hours of events.
 *
 * Query params:
 *   hours: lookback window (default: 24, max: 168)
 *   limit: max entities per type (default: 20)
 *   type: filter by entity type (person|organization|country|topic)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const hours = Math.min(parseInt(searchParams.get("hours") || "24", 10), 168);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
  const typeFilter = searchParams.get("type");

  try {
    const events = await fetchPersistedEvents({ limit: 200, hoursBack: hours });

    // Combine title + summary for NER
    const texts = events.map((e) => `${e.title}. ${e.summary || ""}`);
    const aggregated = extractBulkEntities(texts);

    // Convert to sorted array
    let entities = [...aggregated.values()]
      .map(({ entity, frequency }) => ({
        name: entity.name,
        type: entity.type,
        confidence: entity.confidence,
        frequency,
      }))
      .sort((a, b) => b.frequency - a.frequency);

    // Filter by type if specified
    if (typeFilter) {
      entities = entities.filter((e) => e.type === typeFilter);
    }

    // Group by type
    const grouped = {
      persons: entities.filter((e) => e.type === "person").slice(0, limit),
      organizations: entities
        .filter((e) => e.type === "organization")
        .slice(0, limit),
      countries: entities.filter((e) => e.type === "country").slice(0, limit),
      topics: entities.filter((e) => e.type === "topic").slice(0, limit),
    };

    return NextResponse.json({
      period: `${hours}h`,
      totalEvents: events.length,
      totalEntities: entities.length,
      entities: typeFilter ? entities.slice(0, limit) : undefined,
      grouped: typeFilter ? undefined : grouped,
    });
  } catch {
    return NextResponse.json(
      { error: "Entity extraction failed" },
      { status: 500 }
    );
  }
}
