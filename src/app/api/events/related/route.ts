import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { clusterRelatedEvents } from "@/lib/utils/event-clustering";
import type { IntelItem } from "@/types/intel";

export const runtime = "nodejs";

/**
 * GET /api/events/related
 *
 * With ?id=xxx  -> Find the cluster containing that event
 * Without id   -> Return top 10 largest clusters from last 24h
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("id");

    const db = createServerClient();

    // Fetch last 24h events
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: rows, error } = await db
      .from("events")
      .select("id, title, summary, url, source, category, severity, published_at, lat, lng, country_code, image_url")
      .gte("published_at", since)
      .order("published_at", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map DB rows to IntelItem shape
    const items: IntelItem[] = (rows || []).map((r) => ({
      id: r.id,
      title: r.title || "",
      summary: r.summary || "",
      url: r.url || "",
      source: r.source || "unknown",
      category: r.category || "tech",
      severity: r.severity || "info",
      publishedAt: r.published_at,
      lat: r.lat ?? undefined,
      lng: r.lng ?? undefined,
      countryCode: r.country_code ?? undefined,
      imageUrl: r.image_url ?? undefined,
    }));

    const clusters = clusterRelatedEvents(items);

    if (eventId) {
      // Find the cluster containing the requested event
      const cluster = clusters.find((c) =>
        c.items.some((item) => item.id === eventId)
      );

      if (!cluster) {
        return NextResponse.json(
          { error: "No related events found for this ID" },
          { status: 404 }
        );
      }

      return NextResponse.json({ cluster });
    }

    // Return top 10 largest clusters
    return NextResponse.json({
      clusters: clusters.slice(0, 10),
      total: clusters.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch related events" },
      { status: 500 }
    );
  }
}
