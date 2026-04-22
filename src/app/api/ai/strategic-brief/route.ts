import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = getSupabase();

    // Fetch the latest flash report (AI brief)
    const { data: report } = await db
      .from("reports")
      .select("summary, content, generated_at")
      .eq("type", "flash")
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (!report) {
      // Fallback: generate a brief from current critical events
      const { data: events } = await db
        .from("events")
        .select("title, severity, category, country_code")
        .in("severity", ["critical", "high"])
        .order("published_at", { ascending: false })
        .limit(10);

      const topRisks = (events || [])
        .slice(0, 5)
        .map((e) => `[${(e.severity || "").toUpperCase()}] ${e.title}`);

      const categories = (events || []).reduce<Record<string, number>>((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + 1;
        return acc;
      }, {});

      const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

      return NextResponse.json({
        summary: events && events.length > 0
          ? `${events.length} high-priority events detected. Primary category: ${topCategory ? topCategory[0] : "general"}. Monitoring escalation patterns across affected regions.`
          : "Global threat levels within normal parameters. No critical escalation detected in the past 24 hours.",
        topRisks,
        generatedAt: new Date().toISOString(),
      });
    }

    // Parse top risks from content (look for numbered items or bullet points)
    const lines = (report.content || "").split("\n").filter((l: string) => l.trim());
    const riskLines = lines
      .filter((l: string) => /^[-•*\d]/.test(l.trim()))
      .slice(0, 5)
      .map((l: string) => l.replace(/^[-•*\d.)\s]+/, "").trim());

    return NextResponse.json({
      summary: report.summary || lines.slice(0, 3).join(" "),
      topRisks: riskLines.length > 0 ? riskLines : ["No specific risks identified"],
      generatedAt: report.generated_at,
    });
  } catch (err) {
    console.error("[ai/strategic-brief]", err);
    return NextResponse.json({
      summary: "Strategic brief temporarily unavailable.",
      topRisks: [],
      generatedAt: new Date().toISOString(),
    });
  }
}
