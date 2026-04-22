import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/feeds — Feed performance analytics.
 * Returns feed health metrics: active count, category distribution,
 * recent fetch stats, and error rates.
 */
export async function GET() {
  try {
    const supabase = getSupabase();

    // Get feed counts by category
    const { data: feeds, error: feedsError } = await supabase
      .from("feeds")
      .select("id, name, category, is_active, last_fetched_at, error_count");

    if (feedsError) {
      return NextResponse.json({ error: feedsError.message }, { status: 500 });
    }

    const totalFeeds = feeds?.length || 0;
    const activeFeeds = feeds?.filter((f) => f.is_active !== false).length || 0;

    // Category distribution
    const categories: Record<string, { total: number; active: number; errored: number }> = {};
    for (const feed of feeds || []) {
      if (!categories[feed.category]) {
        categories[feed.category] = { total: 0, active: 0, errored: 0 };
      }
      categories[feed.category].total++;
      if (feed.is_active !== false) categories[feed.category].active++;
      if (feed.error_count && feed.error_count > 0) categories[feed.category].errored++;
    }

    // Feeds with errors
    const errorFeeds = (feeds || [])
      .filter((f) => f.error_count && f.error_count > 0)
      .sort((a, b) => (b.error_count || 0) - (a.error_count || 0))
      .slice(0, 10)
      .map((f) => ({ name: f.name, category: f.category, errors: f.error_count }));

    // Recently fetched (last 24h)
    const oneDayAgo = new Date(Date.now() - 86400_000).toISOString();
    const recentlyFetched = (feeds || []).filter(
      (f) => f.last_fetched_at && f.last_fetched_at > oneDayAgo
    ).length;

    // Get recent event counts
    const { count: recentEvents } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneDayAgo);

    return NextResponse.json({
      summary: {
        totalFeeds,
        activeFeeds,
        inactiveFeeds: totalFeeds - activeFeeds,
        recentlyFetched,
        recentEvents: recentEvents || 0,
      },
      categories,
      topErrors: errorFeeds,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
