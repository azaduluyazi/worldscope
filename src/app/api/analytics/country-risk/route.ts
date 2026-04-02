import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export const runtime = "nodejs";

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 10,
  high: 6,
  medium: 3,
  low: 1,
  info: 0.5,
};

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Missing country code" }, { status: 400 });
  }

  try {
    const db = getSupabase();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: events } = await db
      .from("events")
      .select("severity, category, published_at")
      .eq("country_code", code)
      .gte("published_at", sevenDaysAgo)
      .order("published_at", { ascending: false })
      .limit(200);

    const allEvents = events || [];

    // Calculate weighted instability score (0-100)
    const totalWeight = allEvents.reduce((sum, e) => {
      return sum + (SEVERITY_WEIGHT[e.severity] || 0);
    }, 0);

    // Normalize: cap at 100, logarithmic scaling for realism
    const rawScore = Math.min(100, Math.round(Math.log2(totalWeight + 1) * 12));

    // Category breakdown
    const categories = allEvents.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {});

    // Severity distribution
    const severities = allEvents.reduce<Record<string, number>>((acc, e) => {
      acc[e.severity] = (acc[e.severity] || 0) + 1;
      return acc;
    }, {});

    const level =
      rawScore >= 80 ? "critical" :
      rawScore >= 60 ? "high" :
      rawScore >= 40 ? "elevated" :
      rawScore >= 20 ? "moderate" : "low";

    return NextResponse.json({
      countryCode: code,
      score: rawScore,
      level,
      eventCount: allEvents.length,
      categories,
      severities,
      period: "7d",
    });
  } catch {
    return NextResponse.json({ error: "Failed to calculate risk" }, { status: 500 });
  }
}
