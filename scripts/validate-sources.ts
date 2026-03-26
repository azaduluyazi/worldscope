/**
 * WorldScope Source Validator
 * Tests all RSS feeds and API endpoints for reachability.
 * Usage: npx tsx scripts/validate-sources.ts
 */

import { SEED_FEEDS } from "../src/config/feeds";

const TIMEOUT = 10_000;
const CONCURRENCY = 20; // parallel requests

interface FeedResult {
  name: string;
  url: string;
  category: string;
  status: "ok" | "error" | "timeout" | "redirect";
  httpStatus?: number;
  latency: number;
  error?: string;
  contentType?: string;
}

async function testFeed(feed: (typeof SEED_FEEDS)[0]): Promise<FeedResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "WorldScope/1.0 FeedValidator",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      redirect: "follow",
    });

    clearTimeout(timer);
    const latency = Date.now() - start;
    const contentType = res.headers.get("content-type") || "";

    if (res.ok) {
      return {
        name: feed.name,
        url: feed.url,
        category: feed.category,
        status: "ok",
        httpStatus: res.status,
        latency,
        contentType,
      };
    }

    return {
      name: feed.name,
      url: feed.url,
      category: feed.category,
      status: "error",
      httpStatus: res.status,
      latency,
      error: `HTTP ${res.status} ${res.statusText}`,
      contentType,
    };
  } catch (err: unknown) {
    const latency = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout =
      message.includes("abort") || message.includes("timeout");

    return {
      name: feed.name,
      url: feed.url,
      category: feed.category,
      status: isTimeout ? "timeout" : "error",
      latency,
      error: message.slice(0, 120),
    };
  }
}

async function runBatch<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    // Progress
    const done = Math.min(i + concurrency, items.length);
    process.stdout.write(`\r  Testing feeds: ${done}/${items.length}`);
  }
  process.stdout.write("\n");
  return results;
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║       WorldScope Source Validator v1.0                  ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  const totalFeeds = SEED_FEEDS.length;
  console.log(`📡 Total feeds to test: ${totalFeeds}`);
  console.log(`⚡ Concurrency: ${CONCURRENCY}, Timeout: ${TIMEOUT / 1000}s\n`);

  // ── RSS Feed Tests ───────────────────────────────────────────────
  console.log("━━━ RSS FEED VALIDATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const results = await runBatch(SEED_FEEDS, testFeed, CONCURRENCY);

  // ── Categorize Results ─────────────────────────────────────────
  const ok = results.filter((r) => r.status === "ok");
  const errors = results.filter((r) => r.status === "error");
  const timeouts = results.filter((r) => r.status === "timeout");

  console.log(`\n✅ Working: ${ok.length}/${totalFeeds} (${((ok.length / totalFeeds) * 100).toFixed(1)}%)`);
  console.log(`❌ Errors:  ${errors.length}/${totalFeeds}`);
  console.log(`⏰ Timeout: ${timeouts.length}/${totalFeeds}`);

  // ── Category Breakdown ─────────────────────────────────────────
  const categories = new Map<string, { total: number; ok: number; errors: number; timeouts: number }>();
  for (const r of results) {
    const cat = categories.get(r.category) || { total: 0, ok: 0, errors: 0, timeouts: 0 };
    cat.total++;
    if (r.status === "ok") cat.ok++;
    else if (r.status === "error") cat.errors++;
    else if (r.status === "timeout") cat.timeouts++;
    categories.set(r.category, cat);
  }

  console.log("\n━━━ CATEGORY BREAKDOWN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Category       | Total | OK  | Err | Timeout | Health");
  console.log("─────────────────────────────────────────────────────────");
  for (const [cat, stats] of [...categories.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const health = ((stats.ok / stats.total) * 100).toFixed(0);
    const bar = health === "100" ? "███" : Number(health) > 70 ? "██░" : Number(health) > 40 ? "█░░" : "░░░";
    console.log(
      `${cat.padEnd(15)}| ${String(stats.total).padStart(5)} | ${String(stats.ok).padStart(3)} | ${String(stats.errors).padStart(3)} | ${String(stats.timeouts).padStart(7)} | ${bar} ${health}%`
    );
  }

  // ── Failed Feeds Detail ────────────────────────────────────────
  const failed = [...errors, ...timeouts].sort((a, b) => a.category.localeCompare(b.category));
  if (failed.length > 0) {
    console.log("\n━━━ FAILED FEEDS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    for (const f of failed) {
      const icon = f.status === "timeout" ? "⏰" : "❌";
      console.log(`${icon} [${f.category}] ${f.name}`);
      console.log(`   URL: ${f.url}`);
      console.log(`   ${f.error || `HTTP ${f.httpStatus}`}`);
    }
  }

  // ── HTTP Status Distribution ───────────────────────────────────
  const statusDist = new Map<string, number>();
  for (const r of results) {
    const key = r.httpStatus ? String(r.httpStatus) : r.status === "timeout" ? "TIMEOUT" : "NETWORK_ERR";
    statusDist.set(key, (statusDist.get(key) || 0) + 1);
  }

  console.log("\n━━━ HTTP STATUS DISTRIBUTION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  for (const [status, count] of [...statusDist.entries()].sort()) {
    console.log(`  ${status}: ${count}`);
  }

  // ── Latency Stats ──────────────────────────────────────────────
  const latencies = ok.map((r) => r.latency).sort((a, b) => a - b);
  if (latencies.length > 0) {
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];
    console.log("\n━━━ LATENCY (working feeds) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Avg: ${avg.toFixed(0)}ms | P50: ${p50}ms | P95: ${p95}ms | P99: ${p99}ms`);
  }

  // ── Slowest feeds ──────────────────────────────────────────────
  const slowest = ok.filter((r) => r.latency > 5000).sort((a, b) => b.latency - a.latency);
  if (slowest.length > 0) {
    console.log("\n━━━ SLOW FEEDS (>5s) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    for (const f of slowest.slice(0, 10)) {
      console.log(`  🐌 ${f.name} — ${(f.latency / 1000).toFixed(1)}s`);
    }
  }

  // ── Summary ────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log(`║  OVERALL: ${ok.length}/${totalFeeds} feeds working (${((ok.length / totalFeeds) * 100).toFixed(1)}%)`.padEnd(58) + "║");
  console.log(`║  ${errors.length} errors, ${timeouts.length} timeouts`.padEnd(58) + "║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  // Exit code for CI
  process.exit(failed.length > totalFeeds * 0.5 ? 1 : 0);
}

main().catch(console.error);
