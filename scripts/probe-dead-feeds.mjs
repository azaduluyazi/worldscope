#!/usr/bin/env node
/**
 * Probe every "dead" feed (active but producing 0 events in last 7 days)
 * with a real HEAD+GET request. Classify by HTTP status so we can split:
 *
 *   - 404 / 000 / 5xx   → truly dead, disable
 *   - 403 / 405         → bot-blocked, keep but flag for fetcher improvement
 *   - 200               → fetchable but parse-broken, keep for investigation
 *
 * Outputs results as JSON to stdout so the caller can write SQL from it.
 *
 * Usage:
 *   node scripts/probe-dead-feeds.mjs > feed-probe-results.json
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const db = createClient(url, key);

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function probe(url) {
  const init = {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent": UA,
      Accept:
        "application/rss+xml, application/xml, application/atom+xml, text/xml, */*;q=0.1",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(10_000),
  };
  try {
    const res = await fetch(url, init);
    const body = await res.text().catch(() => "");
    return {
      status: res.status,
      bodyLen: body.length,
      xmlLike: /<rss|<feed|<atom:|<channel/i.test(body.slice(0, 2000)),
    };
  } catch (err) {
    return {
      status: 0,
      error: err instanceof Error ? err.message.slice(0, 80) : String(err),
    };
  }
}

async function main() {
  // Direct query — we filter events separately and cross-reference
  const { data: rows, error: qerr } = await db
    .from("feeds")
    .select("id, name, url, category")
    .eq("is_active", true);
  if (qerr) {
    console.error(qerr.message);
    process.exit(1);
  }

  // Cross-check against events
  const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { data: evs } = await db
    .from("events")
    .select("source")
    .gte("fetched_at", cutoff);
  const producingNames = new Set((evs || []).map((e) => e.source));

  const dead = (rows || []).filter((r) => !producingNames.has(r.name));
  console.error(`Active: ${rows?.length}, dead: ${dead.length}. Probing…`);

  const results = [];
  let i = 0;
  for (const feed of dead) {
    i++;
    const res = await probe(feed.url);
    results.push({ ...feed, ...res });
    if (i % 10 === 0) console.error(`  ${i}/${dead.length}…`);
  }

  // Classify
  const byClass = { dead: [], blocked: [], parseable: [] };
  for (const r of results) {
    if (r.status === 0 || r.status === 404 || r.status >= 500) byClass.dead.push(r);
    else if (r.status === 403 || r.status === 405 || r.status === 429) byClass.blocked.push(r);
    else byClass.parseable.push(r);
  }

  console.error(
    `\nClassification:\n  dead (404/5xx/network): ${byClass.dead.length}\n  blocked (403/405/429): ${byClass.blocked.length}\n  parseable (200 etc):   ${byClass.parseable.length}`,
  );
  console.log(JSON.stringify({ summary: {
    total: results.length,
    dead: byClass.dead.length,
    blocked: byClass.blocked.length,
    parseable: byClass.parseable.length,
  }, classes: byClass }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
