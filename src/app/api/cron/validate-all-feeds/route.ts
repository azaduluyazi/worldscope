import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { sendTelegramLong } from "@/lib/api/telegram";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min — need time to test all feeds

/**
 * GET /api/cron/validate-all-feeds
 *
 * Validates ALL 573+ RSS feeds in the database by attempting to fetch each one.
 * Generates a comprehensive Telegram report grouped by category showing:
 * - Working feeds (✅)
 * - Empty feeds (⚡)
 * - Broken feeds (❌)
 * - Timeout feeds (⏰)
 *
 * Also updates error_count in the feeds table and deactivates feeds with 10+ errors.
 *
 * Cron schedule: Every 6 hours (vercel.json)
 */

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const adminKey = process.env.ADMIN_KEY;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;
  if (adminKey && request.nextUrl.searchParams.get("key") === adminKey) return true;
  return false;
}

interface FeedResult {
  id: string;
  name: string;
  url: string;
  category: string;
  status: "ok" | "empty" | "error" | "timeout";
  items: number;
  durationMs: number;
  error?: string;
}

async function testFeedUrl(url: string, timeoutMs = 12000): Promise<{ ok: boolean; items: number; error?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "WorldScope/1.0 (Feed Validator; +https://troiamedia.com)",
        Accept: "application/rss+xml, application/xml, application/atom+xml, text/xml, */*",
      },
    });

    clearTimeout(timer);

    if (!res.ok) {
      return { ok: false, items: 0, error: `HTTP ${res.status}` };
    }

    const text = await res.text();

    // Count <item> or <entry> tags to estimate feed items
    const itemCount = (text.match(/<item[\s>]/gi) || []).length +
      (text.match(/<entry[\s>]/gi) || []).length;

    if (text.length < 100) {
      return { ok: false, items: 0, error: "Empty response" };
    }

    if (itemCount === 0 && !text.includes("<rss") && !text.includes("<feed") && !text.includes("<RDF")) {
      return { ok: false, items: 0, error: "Not valid RSS/Atom" };
    }

    return { ok: true, items: itemCount };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    if (msg.includes("abort")) {
      return { ok: false, items: 0, error: "TIMEOUT" };
    }
    return { ok: false, items: 0, error: msg.slice(0, 80) };
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const db = createServerClient();

  // Fetch ALL feeds from Supabase
  const { data: feeds } = await db
    .from("feeds")
    .select("id, name, url, category, is_active, error_count")
    .order("category");

  if (!feeds || feeds.length === 0) {
    return NextResponse.json({ error: "No feeds found" }, { status: 404 });
  }

  const results: FeedResult[] = [];

  // Test in batches of 10 (avoid connection pool exhaustion)
  for (let i = 0; i < feeds.length; i += 10) {
    const batch = feeds.slice(i, i + 10);
    const batchResults = await Promise.allSettled(
      batch.map(async (feed): Promise<FeedResult> => {
        const start = Date.now();
        const { ok, items, error } = await testFeedUrl(feed.url);

        let status: FeedResult["status"];
        if (ok && items > 0) status = "ok";
        else if (ok && items === 0) status = "empty";
        else if (error === "TIMEOUT") status = "timeout";
        else status = "error";

        return {
          id: feed.id,
          name: feed.name,
          url: feed.url,
          category: feed.category,
          status,
          items,
          durationMs: Date.now() - start,
          error: !ok ? error : undefined,
        };
      })
    );

    for (const r of batchResults) {
      if (r.status === "fulfilled") results.push(r.value);
    }

    // Brief pause between batches
    if (i + 10 < feeds.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  // Update error_count in Supabase
  const failedFeeds = results.filter((r) => r.status === "error" || r.status === "timeout");
  const okFeeds = results.filter((r) => r.status === "ok");

  // Increment error_count for failed feeds
  for (const f of failedFeeds) {
    await db
      .from("feeds")
      .update({ error_count: (feeds.find((feed) => feed.id === f.id)?.error_count || 0) + 1 })
      .eq("id", f.id);
  }

  // Reset error_count for OK feeds
  if (okFeeds.length > 0) {
    const okIds = okFeeds.map((f) => f.id);
    await db
      .from("feeds")
      .update({ error_count: 0, last_fetched_at: new Date().toISOString() })
      .in("id", okIds);
  }

  // Deactivate feeds with 10+ consecutive errors
  const { data: deactivated } = await db
    .from("feeds")
    .update({ is_active: false })
    .gte("error_count", 10)
    .eq("is_active", true)
    .select("name, url");

  // ── Build FULL Telegram Report (every feed listed) ──────────
  const totalOk = results.filter((r) => r.status === "ok").length;
  const totalEmpty = results.filter((r) => r.status === "empty").length;
  const totalError = results.filter((r) => r.status === "error").length;
  const totalTimeout = results.filter((r) => r.status === "timeout").length;
  const successRate = Math.round((totalOk / results.length) * 100);
  const totalItems = results.reduce((s, r) => s + r.items, 0);
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  const categories = [...new Set(results.map((r) => r.category))].sort();

  const icon = (status: string) => {
    switch (status) {
      case "ok": return "✅";
      case "empty": return "⚡";
      case "timeout": return "⏰";
      case "error": return "❌";
      default: return "❓";
    }
  };

  // Build report — ALL feeds listed under each category
  let report = `<b>📡 FULL FEED VALIDATION REPORT</b>\n`;
  report += `🕐 ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC\n\n`;

  // Summary header
  report += `<b>📊 SUMMARY</b>\n`;
  report += `Total: <b>${results.length}</b> | ✅ ${totalOk} | ⚡ ${totalEmpty} | ❌ ${totalError} | ⏰ ${totalTimeout}\n`;
  report += `Success: <b>${successRate}%</b> | Items: <b>${totalItems}</b> | Duration: <b>${durationSec}s</b>\n`;

  if (deactivated && deactivated.length > 0) {
    report += `\n<b>🚫 AUTO-DEACTIVATED:</b>\n`;
    for (const d of deactivated) {
      report += `  ${escapeHtml(d.name)}\n`;
    }
  }

  // ALL feeds grouped by category
  for (const cat of categories) {
    const catResults = results.filter((r) => r.category === cat);
    const catOk = catResults.filter((r) => r.status === "ok").length;
    const pct = Math.round((catOk / catResults.length) * 100);
    const bar = pct >= 80 ? "🟢" : pct >= 50 ? "🟡" : "🔴";

    report += `\n${bar} <b>${cat.toUpperCase()}</b> (${catOk}/${catResults.length} — ${pct}%)\n`;

    // Sort: ok first, then empty, then errors
    const sorted = [...catResults].sort((a, b) => {
      const order = { ok: 0, empty: 1, timeout: 2, error: 3 };
      return (order[a.status] || 4) - (order[b.status] || 4);
    });

    for (const f of sorted) {
      const dur = f.durationMs < 1000 ? `${f.durationMs}ms` : `${(f.durationMs / 1000).toFixed(1)}s`;
      if (f.status === "ok") {
        report += `${icon(f.status)} ${escapeHtml(f.name)}: ${f.items} items (${dur})\n`;
      } else if (f.status === "empty") {
        report += `${icon(f.status)} ${escapeHtml(f.name)}: 0 items (${dur})\n`;
      } else {
        report += `${icon(f.status)} ${escapeHtml(f.name)}: ${escapeHtml(f.error || "unknown")} (${dur})\n`;
      }
    }
  }

  // Telegram sending disabled — unified-report handles all notifications.
  // This endpoint still runs for DB maintenance (error_count, deactivation).
  const telegramSent = false;

  return NextResponse.json({
    success: true,
    telegramSent,
    totalFeeds: results.length,
    ok: totalOk,
    empty: totalEmpty,
    errors: totalError,
    timeouts: totalTimeout,
    successRate,
    totalItems,
    durationMs: Date.now() - startTime,
    deactivated: deactivated?.length || 0,
    brokenFeeds: results
      .filter((r) => r.status === "error" || r.status === "timeout")
      .map((f) => ({ name: f.name, url: f.url, error: f.error })),
  });
}
