import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export const runtime = "nodejs";

/**
 * GET /api/admin/feed-dashboard — Real-time feed status dashboard.
 *
 * Returns detailed feed health information for admin monitoring.
 * Includes: per-feed status, error rates, last fetch times, category breakdown.
 */
export async function GET(request: NextRequest) {
  // Optional admin auth
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_KEY;
  if (adminKey && authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    // Get all feeds with status
    const { data: feeds, error } = await supabase
      .from("feeds")
      .select("id, name, url, category, language, is_active, last_fetched_at, error_count, created_at")
      .order("error_count", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const allFeeds = feeds || [];

    // Compute aggregates
    const total = allFeeds.length;
    const active = allFeeds.filter((f) => f.is_active).length;
    const deactivated = allFeeds.filter((f) => !f.is_active).length;
    const withErrors = allFeeds.filter((f) => f.error_count > 0 && f.is_active).length;
    const healthy = active - withErrors;

    // Stale feeds (not fetched in 24h)
    const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const stale = allFeeds.filter(
      (f) => f.is_active && (!f.last_fetched_at || f.last_fetched_at < staleThreshold)
    ).length;

    // Category breakdown
    const byCategory: Record<string, { total: number; active: number; errors: number }> = {};
    allFeeds.forEach((f) => {
      if (!byCategory[f.category]) {
        byCategory[f.category] = { total: 0, active: 0, errors: 0 };
      }
      byCategory[f.category].total++;
      if (f.is_active) byCategory[f.category].active++;
      if (f.error_count > 0) byCategory[f.category].errors++;
    });

    // Language breakdown
    const byLanguage: Record<string, number> = {};
    allFeeds.forEach((f) => {
      const lang = f.language || "en";
      byLanguage[lang] = (byLanguage[lang] || 0) + 1;
    });

    // Top error feeds
    const topErrors = allFeeds
      .filter((f) => f.error_count > 0)
      .slice(0, 15)
      .map((f) => ({
        name: f.name,
        url: f.url,
        category: f.category,
        errorCount: f.error_count,
        isActive: f.is_active,
        lastFetched: f.last_fetched_at,
      }));

    return NextResponse.json({
      summary: {
        total,
        active,
        deactivated,
        healthy,
        withErrors,
        stale,
        healthRate: total > 0 ? Math.round((healthy / total) * 100) : 0,
      },
      byCategory,
      byLanguage,
      topErrors,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
