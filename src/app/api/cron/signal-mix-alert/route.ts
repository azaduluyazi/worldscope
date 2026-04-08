import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import {
  analyzeSignalMix,
  renderSignalMixForTelegram,
  type SourceHit,
} from "@/lib/convergence/signal-mix";
import { sendTelegram } from "@/lib/api/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Daily Signal Mix health check — sends a Telegram alert if anomalies are
 * detected in the event distribution over the last 24 hours.
 *
 * Runs at 09:00 UTC daily. The behaviour:
 *   - If there are NO anomalies, sends a short "all clear" message.
 *   - If there ARE anomalies, sends a formatted report with severity icons.
 *   - If TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are missing, logs and returns
 *     success without sending — this keeps the cron from failing when env
 *     vars aren't configured yet (e.g., first deploy after adding the cron).
 *
 * Auth: Bearer CRON_SECRET.
 */

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const hours = 24;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  try {
    const db = createServerClient();
    const { data, error } = await db
      .from("events")
      .select("source")
      .gte("published_at", since)
      .limit(20000);

    if (error) {
      console.error("[signal-mix-alert] DB error:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      counts.set(row.source, (counts.get(row.source) ?? 0) + 1);
    }
    const hits: SourceHit[] = Array.from(counts.entries()).map(
      ([source, count]) => ({ source, count })
    );

    const report = analyzeSignalMix(hits, hours);

    // Compose the message — always include a summary, anomalies or not
    const message = renderSignalMixForTelegram(report);

    // Send via Telegram. The client returns false (not throw) when env vars
    // are missing, so this is safe to call unconditionally.
    const sent = await sendTelegram(message, { parseMode: "HTML" });

    console.log(
      `[signal-mix-alert] ${report.anomalies.length} anomalies, telegram sent=${sent}, duration=${Date.now() - startTime}ms`
    );

    return NextResponse.json({
      success: true,
      anomalyCount: report.anomalies.length,
      totalEvents: report.totalEvents,
      socialLayerPct: report.socialLayerPct,
      telegramSent: sent,
      durationMs: Date.now() - startTime,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[signal-mix-alert] unexpected error:", msg);
    return NextResponse.json(
      { success: false, error: msg, durationMs: Date.now() - startTime },
      { status: 500 }
    );
  }
}
