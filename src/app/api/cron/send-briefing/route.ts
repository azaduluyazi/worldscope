import { NextResponse } from "next/server";
import { fetchPersistedEvents } from "@/lib/db/events";
import { detectAnomalies } from "@/lib/utils/anomaly-detection";
import { buildDailyBriefingEmail } from "@/lib/mail/templates";
import { sendMail, getDailySubscribers } from "@/lib/mail/sender";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET /api/cron/send-briefing
 * Sends daily intelligence briefing to premium subscribers.
 * Scheduled via Vercel cron: every day at 08:00 UTC.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Get subscribers
    const subscribers = await getDailySubscribers();
    if (subscribers.length === 0) {
      return NextResponse.json({ success: true, sent: 0, reason: "No subscribers" });
    }

    // 2. Get intel data
    const items = await fetchPersistedEvents({ limit: 500, hoursBack: 24 });
    const anomalies = detectAnomalies(items, 24, 6);

    // 3. Generate AI summary
    let aiSummary = "Daily intelligence summary unavailable.";
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://worldscope-two.vercel.app"}/api/ai/brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: "en" }),
      });
      if (res.ok) {
        aiSummary = await res.text();
      }
    } catch {
      // AI summary optional — continue without it
    }

    // 4. Build email
    const sources = new Set(items.map((i) => i.source));
    const stats = {
      total: items.length,
      critical: items.filter((i) => i.severity === "critical").length,
      high: items.filter((i) => i.severity === "high").length,
      sources: sources.size,
    };

    const date = new Date().toISOString().split("T")[0];
    const { subject, html } = buildDailyBriefingEmail({
      items,
      aiSummary,
      anomalies,
      stats,
      date,
    });

    // 5. Send to all subscribers
    await sendMail({ to: subscribers, subject, html });

    return NextResponse.json({
      success: true,
      sent: subscribers.length,
      stats,
      anomalies: anomalies.length,
    });
  } catch (e) {
    console.error("[Cron] Briefing send failed:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
