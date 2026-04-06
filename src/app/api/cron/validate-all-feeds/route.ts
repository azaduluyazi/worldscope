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

  // ── Build Telegram Report ──────────────────────────────────
  const totalOk = results.filter((r) => r.status === "ok").length;
  const totalEmpty = results.filter((r) => r.status === "empty").length;
  const totalError = results.filter((r) => r.status === "error").length;
  const totalTimeout = results.filter((r) => r.status === "timeout").length;
  const successRate = Math.round((totalOk / results.length) * 100);
  const totalItems = results.reduce((s, r) => s + r.items, 0);
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  const categories = [...new Set(results.map((r) => r.category))].sort();

  let report = `<b>📡 FULL FEED VALIDATION REPORT</b>\n`;
  report += `🕐 ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC\n\n`;

  // Summary
  report += `<b>📊 SUMMARY</b>\n`;
  report += `Total feeds: <b>${results.length}</b>\n`;
  report += `✅ Working: <b>${totalOk}</b> (${successRate}%)\n`;
  report += `⚡ Empty: <b>${totalEmpty}</b>\n`;
  report += `❌ Broken: <b>${totalError}</b>\n`;
  report += `⏰ Timeout: <b>${totalTimeout}</b>\n`;
  report += `📰 Total items: <b>${totalItems}</b>\n`;
  report += `⏱ Duration: <b>${durationSec}s</b>\n`;

  if (deactivated && deactivated.length > 0) {
    report += `\n<b>🚫 DEACTIVATED (10+ errors):</b>\n`;
    for (const d of deactivated) {
      report += `  ❌ ${escapeHtml(d.name)}\n`;
    }
  }

  // Category breakdown
  report += `\n<b>📂 BY CATEGORY</b>\n`;
  for (const cat of categories) {
    const catResults = results.filter((r) => r.category === cat);
    const catOk = catResults.filter((r) => r.status === "ok").length;
    const _catFail = catResults.filter((r) => r.status !== "ok").length;
    const pct = Math.round((catOk / catResults.length) * 100);
    const bar = pct >= 80 ? "🟢" : pct >= 50 ? "🟡" : "🔴";
    report += `${bar} <b>${cat.toUpperCase()}</b>: ${catOk}/${catResults.length} (${pct}%)\n`;
  }

  // List broken feeds
  const broken = results.filter((r) => r.status === "error" || r.status === "timeout");
  if (broken.length > 0) {
    report += `\n<b>❌ BROKEN FEEDS (${broken.length})</b>\n`;
    for (const f of broken.slice(0, 50)) { // Max 50 to avoid Telegram message limit
      report += `  ${f.status === "timeout" ? "⏰" : "❌"} ${escapeHtml(f.name)} — ${escapeHtml(f.error || "unknown")}\n`;
    }
    if (broken.length > 50) {
      report += `  ... and ${broken.length - 50} more\n`;
    }
  }

  // Send to Telegram
  let telegramSent = false;
  const notify = request.nextUrl.searchParams.get("notify") !== "false";
  if (notify) {
    telegramSent = await sendTelegramLong(report);
  }

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
    brokenFeeds: broken.map((f) => ({ name: f.name, url: f.url, error: f.error })),
  });
}
