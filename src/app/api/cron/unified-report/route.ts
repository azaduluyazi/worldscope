import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { sendTelegramLong } from "@/lib/api/telegram";
import {
  analyzeSignalMix,
  type SourceHit,
} from "@/lib/convergence/signal-mix";
import { fetchGscPerformance } from "@/lib/api/google-search-console";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/cron/unified-report
 *
 * Single daily Telegram report combining:
 *   1. Signal Mix — anomaly detection, tier distribution
 *   2. Feed Health — summary stats, only broken/timeout feeds listed
 *   3. API Health — summary stats, only failed APIs listed
 *
 * Replaces 3 separate reports (signal-mix-alert, validate-all-feeds, source-health)
 * to reduce Telegram noise. Individual endpoints still run for DB maintenance
 * but no longer send Telegram.
 *
 * Cron: daily at 08:00 UTC (vercel.json)
 */

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const adminKey = process.env.ADMIN_KEY;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;
  if (adminKey && request.nextUrl.searchParams.get("key") === adminKey)
    return true;
  return false;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Section 1: Signal Mix Analysis ─────────────────────────
async function getSignalMixSection(): Promise<{
  text: string;
  anomalyCount: number;
  totalEvents: number;
}> {
  const db = createServerClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await db
    .from("events")
    .select("source")
    .gte("published_at", since)
    .limit(20000);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.source, (counts.get(row.source) ?? 0) + 1);
  }
  const hits: SourceHit[] = Array.from(counts.entries()).map(
    ([source, count]) => ({ source, count })
  );

  const report = analyzeSignalMix(hits, 24);

  const lines: string[] = [];
  lines.push(
    `📊 <b>${report.totalEvents}</b> events | <b>${report.totalSources}</b> sources | Social: <b>${report.socialLayerPct}%</b>`
  );

  // Tier summary — one line
  const tierParts = report.tierDistribution
    .filter((t) => t.events > 0)
    .map((t) => {
      const label = t.tier === "unknown" ? "T?" : `T${t.tier}`;
      return `${label}:${t.percentage}%`;
    });
  lines.push(`Tiers: ${tierParts.join(" | ")}`);

  if (report.anomalies.length > 0) {
    for (const a of report.anomalies) {
      const icon = a.severity === "critical" ? "🔴" : "🟡";
      lines.push(`${icon} ${a.message}`);
    }
  } else {
    lines.push("✅ No anomalies");
  }

  return {
    text: lines.join("\n"),
    anomalyCount: report.anomalies.length,
    totalEvents: report.totalEvents,
  };
}

// ── Section 2: Feed Health Summary ─────────────────────────
async function getFeedHealthSection(): Promise<{
  text: string;
  total: number;
  ok: number;
  broken: number;
}> {
  const db = createServerClient();
  const { data: feeds } = await db
    .from("feeds")
    .select("name, category, is_active, error_count")
    .order("category");

  if (!feeds || feeds.length === 0) {
    return { text: "No feeds in database", total: 0, ok: 0, broken: 0 };
  }

  const active = feeds.filter((f) => f.is_active);
  const inactive = feeds.filter((f) => !f.is_active);
  const highError = feeds.filter(
    (f) => f.is_active && (f.error_count ?? 0) >= 3
  );

  const lines: string[] = [];
  lines.push(
    `📡 <b>${active.length}</b>/${feeds.length} active feeds`
  );

  if (inactive.length > 0) {
    lines.push(`🚫 ${inactive.length} deactivated`);
  }

  // Only list problematic feeds (error_count >= 3)
  if (highError.length > 0) {
    lines.push("");
    lines.push(`<b>⚠️ ${highError.length} feeds with 3+ errors:</b>`);
    for (const f of highError.slice(0, 15)) {
      lines.push(
        `  ❌ ${escapeHtml(f.name)} (${f.category}) — ${f.error_count} errors`
      );
    }
    if (highError.length > 15) {
      lines.push(`  ... +${highError.length - 15} more`);
    }
  }

  return {
    text: lines.join("\n"),
    total: feeds.length,
    ok: active.length,
    broken: highError.length,
  };
}

// ── Section 3: API Source Health (lightweight) ──────────────
async function getApiHealthSection(): Promise<{
  text: string;
  checked: number;
  failed: number;
}> {
  // Check gateway circuit breaker state — no need to re-test all APIs
  try {
    const { getGatewayHealth } = await import("@/lib/api/gateway");
    const gw = getGatewayHealth();
    const openCircuits = gw.filter((g) => g.isOpen);

    const lines: string[] = [];
    lines.push(
      `🔌 Gateway: <b>${gw.length - openCircuits.length}</b>/${gw.length} circuits healthy`
    );

    if (openCircuits.length > 0) {
      for (const c of openCircuits) {
        lines.push(`  🔴 ${c.sourceId}: ${c.failures} failures`);
      }
    }

    return {
      text: lines.join("\n"),
      checked: gw.length,
      failed: openCircuits.length,
    };
  } catch (err) {
    console.error("[cron/unified-report]", err);
    return {
      text: "🔌 Gateway health: unavailable",
      checked: 0,
      failed: 0,
    };
  }
}

// ── Section 4: Google Search Console (7-day) ──────────────
async function getGscSection(): Promise<{
  text: string;
  clicks: number;
  impressions: number;
} | null> {
  try {
    const perf = await fetchGscPerformance();
    if (!perf) return null; // env vars missing — skip silently

    const lines: string[] = [];
    lines.push(
      `🔍 <b>${perf.totalClicks}</b> clicks | <b>${perf.totalImpressions}</b> impressions`
    );
    lines.push(
      `CTR: <b>${(perf.avgCtr * 100).toFixed(1)}%</b> | Avg pos: <b>${perf.avgPosition.toFixed(1)}</b>`
    );

    // Top 5 queries
    if (perf.topQueries.length > 0) {
      lines.push("");
      lines.push("<b>Top queries:</b>");
      for (const q of perf.topQueries.slice(0, 5)) {
        lines.push(
          `  ${escapeHtml(q.keys[0])} — ${q.clicks}c / ${q.impressions}i`
        );
      }
    }

    // Top 3 pages
    if (perf.topPages.length > 0) {
      lines.push("");
      lines.push("<b>Top pages:</b>");
      for (const p of perf.topPages.slice(0, 3)) {
        // Show only the path, not full URL
        const path = p.keys[0].replace(/^https?:\/\/[^/]+/, "") || "/";
        lines.push(`  ${escapeHtml(path)} — ${p.clicks}c / ${p.impressions}i`);
      }
    }

    return {
      text: lines.join("\n"),
      clicks: perf.totalClicks,
      impressions: perf.totalImpressions,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[unified-report] GSC error:", msg);
    return {
      text: `⚠️ GSC unavailable: ${msg.slice(0, 80)}`,
      clicks: 0,
      impressions: 0,
    };
  }
}

// ── Main handler ───────────────────────────────────────────
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  // Run all sections in parallel
  const [signalMix, feedHealth, apiHealth, gsc] = await Promise.all([
    getSignalMixSection(),
    getFeedHealthSection(),
    getApiHealthSection(),
    getGscSection(),
  ]);

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const dur = ((Date.now() - startTime) / 1000).toFixed(1);

  // Build compact unified report
  let report = `<b>🌐 WORLDSCOPE DAILY REPORT</b>\n`;
  report += `🕐 ${now} UTC\n\n`;

  report += `<b>🧭 Signal Mix (24h)</b>\n`;
  report += signalMix.text + "\n\n";

  report += `<b>📡 Feed Health</b>\n`;
  report += feedHealth.text + "\n\n";

  report += `<b>🔌 API Health</b>\n`;
  report += apiHealth.text + "\n\n";

  // GSC section — only if configured
  if (gsc) {
    report += `<b>🔍 Search Console (7d)</b>\n`;
    report += gsc.text + "\n\n";
  }

  report += `⏱ Report generated in ${dur}s`;

  // Send to Telegram
  const notify = request.nextUrl.searchParams.get("notify") !== "false";
  let telegramSent = false;
  if (notify) {
    telegramSent = await sendTelegramLong(report);
  }

  return NextResponse.json({
    success: true,
    telegramSent,
    signalMix: {
      anomalies: signalMix.anomalyCount,
      totalEvents: signalMix.totalEvents,
    },
    feedHealth: {
      total: feedHealth.total,
      active: feedHealth.ok,
      problematic: feedHealth.broken,
    },
    apiHealth: {
      checked: apiHealth.checked,
      failed: apiHealth.failed,
    },
    gsc: gsc
      ? { clicks: gsc.clicks, impressions: gsc.impressions }
      : null,
    durationMs: Date.now() - startTime,
  });
}
