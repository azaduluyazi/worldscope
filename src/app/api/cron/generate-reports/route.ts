import { NextResponse } from "next/server";
import { generateText } from "ai";
import { briefModel } from "@/lib/ai/providers";
import { createServerClient } from "@/lib/db/supabase";
import { fetchPersistedEvents } from "@/lib/db/events";
import { deliverWebhooks } from "@/lib/notifications/webhook-delivery";
import { sendDigests } from "@/lib/notifications/email-digest";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * GET /api/cron/generate-reports
 * Vercel Cron job — generates daily reports automatically.
 * Runs daily at 06:00 UTC. On Mondays, also generates a weekly report.
 *
 * Schedule: "0 6 * * *" (every day at 06:00 UTC)
 */

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

interface ReportResult {
  type: "daily" | "weekly";
  lang: string;
  date: string;
  eventCount: number;
  wordCount: number;
  success: boolean;
  error?: string;
}

async function generateReport(
  type: "daily" | "weekly",
  lang: "en" | "tr"
): Promise<ReportResult> {
  const hoursBack = type === "weekly" ? 168 : 24;
  const reportDate = new Date().toISOString().split("T")[0];

  try {
    const events = await fetchPersistedEvents({ limit: 150, hoursBack });

    if (events.length < 3) {
      return {
        type, lang, date: reportDate, eventCount: events.length,
        wordCount: 0, success: false,
        error: `Insufficient data: only ${events.length} events`,
      };
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
      .slice(0, 40)
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
## YÖNETİCİ ÖZETİ
## ANA GELİŞMELER
## BÖLGESEL ANALİZ
## TEHDİT DEĞERLENDİRMESİ
## PİYASA ETKİSİ
## ÖNÜMÜZDEKİ DÖNEM TAHMİNLERİ
${type === "weekly" ? "800-1200" : "500-800"} kelime arasında tut. Profesyonel ve analitik ol.`
      : `You are WorldScope AI intelligence analyst. Write a comprehensive ${type} intelligence report. Structure with:
## EXECUTIVE SUMMARY
## KEY DEVELOPMENTS
## REGIONAL ANALYSIS
## THREAT ASSESSMENT
## MARKET IMPACT
## FORECAST
Keep between ${type === "weekly" ? "800-1200" : "500-800"} words. Be professional and analytical.`;

    const { text } = await generateText({
      model: briefModel,
      system: systemPrompt,
      prompt: `Generate a ${type} intelligence report based on:\n\n${statsBlock}\n\nTop headlines:\n${topHeadlines}`,
    });

    // Extract a one-line summary for OG card
    const firstParagraph = text
      .split("\n")
      .find((line) => line.trim() && !line.startsWith("#") && !line.startsWith("-"));
    const ogSummary = firstParagraph?.slice(0, 200) || `WorldScope ${type} intelligence report`;

    // Save to Supabase
    const db = createServerClient();
    const { error: upsertError } = await db.from("reports").upsert(
      {
        type,
        lang,
        date: reportDate,
        content: text,
        event_count: events.length,
        og_summary: ogSummary,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "type,lang,date" }
    );

    if (upsertError) {
      return {
        type, lang, date: reportDate, eventCount: events.length,
        wordCount: text.split(/\s+/).length, success: false,
        error: `DB error: ${upsertError.message}`,
      };
    }

    return {
      type, lang, date: reportDate,
      eventCount: events.length,
      wordCount: text.split(/\s+/).length,
      success: true,
    };
  } catch (err) {
    return {
      type, lang, date: reportDate, eventCount: 0,
      wordCount: 0, success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const results: ReportResult[] = [];
  const isMonday = new Date().getUTCDay() === 1;

  // Always generate daily report in both languages
  const dailyResults = await Promise.allSettled([
    generateReport("daily", "en"),
    generateReport("daily", "tr"),
  ]);

  for (const r of dailyResults) {
    results.push(r.status === "fulfilled" ? r.value : {
      type: "daily", lang: "?", date: "", eventCount: 0,
      wordCount: 0, success: false, error: "Promise rejected",
    });
  }

  // On Mondays, also generate weekly report
  if (isMonday) {
    const weeklyResults = await Promise.allSettled([
      generateReport("weekly", "en"),
      generateReport("weekly", "tr"),
    ]);

    for (const r of weeklyResults) {
      results.push(r.status === "fulfilled" ? r.value : {
        type: "weekly", lang: "?", date: "", eventCount: 0,
        wordCount: 0, success: false, error: "Promise rejected",
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  // ── Notifications: webhooks + email digest (fire-and-forget) ──
  let webhookStats = { sent: 0, failed: 0 };
  let emailStats = { sent: 0, failed: 0 };

  try {
    const intelItems = await fetchPersistedEvents({ limit: 50, hoursBack: 24 });

    // Deliver webhooks (critical/high events)
    webhookStats = await deliverWebhooks(intelItems);

    // Send email digests
    const frequency = isMonday ? "weekly" : "daily";
    emailStats = await sendDigests(intelItems, frequency);
    // On Mondays also send daily
    if (isMonday) {
      const dailyEmail = await sendDigests(intelItems, "daily");
      emailStats.sent += dailyEmail.sent;
      emailStats.failed += dailyEmail.failed;
    }
  } catch (err) {
    console.error("[cron/generate-reports]", err);
    // Notification failures should not break the cron
  }

  return NextResponse.json({
    success: failCount === 0,
    generated: results.length,
    succeeded: successCount,
    failed: failCount,
    isMonday,
    results,
    notifications: {
      webhooks: webhookStats,
      emails: emailStats,
    },
    durationMs: Date.now() - startTime,
  });
}
