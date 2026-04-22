import { NextResponse } from "next/server";
import { generateText } from "ai";
import { briefModel } from "@/lib/ai/providers";
import { createServerClient } from "@/lib/db/supabase";
import { fetchPersistedEvents } from "@/lib/db/events";
import { checkStrictRateLimit } from "@/lib/middleware/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/ai/report — Generate a daily or weekly intelligence report.
 * Body: { type: "daily" | "weekly", lang?: "en" | "tr" }
 * Saves the report to Supabase for SEO pages.
 */
export async function POST(request: Request) {
  const rl = await checkStrictRateLimit(request);
  if (rl) return rl;
  try {
    const body = await request.json().catch(() => ({}));
    const type: "daily" | "weekly" = body.type === "weekly" ? "weekly" : "daily";
    const lang: string = body.lang === "tr" ? "tr" : "en";
    const hoursBack = type === "weekly" ? 168 : 24;

    // Fetch events from Supabase for the report period
    const events = await fetchPersistedEvents({ limit: 100, hoursBack });

    if (events.length < 3) {
      return NextResponse.json(
        { error: "Insufficient data for report generation" },
        { status: 400 }
      );
    }

    // Build summary stats
    const catCount: Record<string, number> = {};
    const sevCount: Record<string, number> = {};
    let geoCount = 0;

    events.forEach((e) => {
      catCount[e.category] = (catCount[e.category] || 0) + 1;
      sevCount[e.severity] = (sevCount[e.severity] || 0) + 1;
      if (e.lat != null) geoCount++;
    });

    const topHeadlines = events
      .slice(0, 30)
      .map(
        (e, i) =>
          `${i + 1}. [${e.severity.toUpperCase()}/${e.category}] ${e.title} (${e.source})`
      )
      .join("\n");

    const statsBlock = `Period: ${type === "weekly" ? "Last 7 days" : "Last 24 hours"}
Total events: ${events.length}
Severity: ${Object.entries(sevCount).map(([k, v]) => `${k}=${v}`).join(", ")}
Categories: ${Object.entries(catCount).sort(([, a], [, b]) => b - a).map(([k, v]) => `${k}=${v}`).join(", ")}
Geo-located: ${geoCount}/${events.length}`;

    const systemPrompt = lang === "tr"
      ? `Sen WorldScope AI istihbarat analistisin. ${type === "weekly" ? "Haftalık" : "Günlük"} kapsamlı bir istihbarat raporu yaz. Türkçe yaz. Rapor şu bölümleri içermeli:
## YÖNETİCİ ÖZETİ, ## ANA GELİŞMELER, ## BÖLGESEL ANALİZ, ## TEHDİT DEĞERLENDİRMESİ, ## PİYASA ETKİSİ, ## ÖNÜMÜZDEKİ DÖNEM TAHMİNLERİ
500-800 kelime arasında tut.`
      : `You are WorldScope AI intelligence analyst. Write a comprehensive ${type} intelligence report. Structure with:
## EXECUTIVE SUMMARY, ## KEY DEVELOPMENTS, ## REGIONAL ANALYSIS, ## THREAT ASSESSMENT, ## MARKET IMPACT, ## FORECAST
Keep between 500-800 words.`;

    const { text } = await generateText({
      model: briefModel,
      system: systemPrompt,
      prompt: `Generate a ${type} intelligence report based on:\n\n${statsBlock}\n\nTop headlines:\n${topHeadlines}`,
    });

    // Save to Supabase for SEO pages
    const db = createServerClient();
    const reportDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    await db.from("reports").upsert(
      {
        type,
        lang,
        date: reportDate,
        content: text,
        event_count: events.length,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "type,lang,date" }
    );

    return NextResponse.json({
      type,
      lang,
      date: reportDate,
      content: text,
      eventCount: events.length,
    });
  } catch (err) {
    console.error("[ai/report]", err);
    return NextResponse.json(
      { error: "Report generation failed" },
      { status: 500 }
    );
  }
}
