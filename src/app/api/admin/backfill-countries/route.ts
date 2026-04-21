/**
 * POST /api/admin/backfill-countries
 *
 * One-shot admin job — for every event row with country_code IS NULL,
 * run extractCountryCode(title, summary) and UPDATE when we get a hit.
 * Batched to avoid timing out on large tables (195k rows today).
 *
 * Auth: Bearer ADMIN_KEY header. Intentionally not CRON_SECRET because
 * this is manual-only, not scheduled.
 *
 * Query params:
 *   - batch     (default 500)  — rows per upsert cycle
 *   - max       (default 5000) — hard stop; run again to continue
 *   - dry       (default 0)    — 1 = don't write, just count
 *
 * Typical launch run: POST with max=50000. On Vercel's 300s limit we
 * process ~20k rows per invocation, so the caller repeats until the
 * endpoint returns `done: true`.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { extractCountryCode } from "@/lib/geo/extract-country";

export const runtime = "nodejs";
export const maxDuration = 300;

function requireAdmin(req: Request): NextResponse | null {
  const expected = process.env.ADMIN_KEY;
  if (!expected) return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(req: Request) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const url = new URL(req.url);
  const batch = Math.min(Math.max(Number(url.searchParams.get("batch") ?? 500), 50), 1000);
  const max = Math.min(Math.max(Number(url.searchParams.get("max") ?? 5000), 100), 100000);
  const dry = url.searchParams.get("dry") === "1";

  const db = createServerClient();
  let processed = 0;
  let tagged = 0;
  let cursor: string | null = null;

  while (processed < max) {
    // Grab the next batch of NULL-country rows. Keyset pagination over
    // `id` so we don't re-scan already-processed rows between batches.
    let query = db
      .from("events")
      .select("id, title, summary")
      .is("country_code", null)
      .order("id", { ascending: true })
      .limit(batch);
    if (cursor) query = query.gt("id", cursor);

    const { data: rows, error } = await query;
    if (error) {
      return NextResponse.json(
        { error: `fetch failed: ${error.message}`, processed, tagged },
        { status: 500 },
      );
    }
    if (!rows || rows.length === 0) {
      return NextResponse.json({
        status: "done",
        done: true,
        processed,
        tagged,
        dry,
      });
    }

    // Extract in-memory, then write only the hits — one UPDATE per row is
    // fine at this volume and keeps the SQL simple.
    const updates: { id: string; country_code: string }[] = [];
    for (const row of rows) {
      const code = extractCountryCode(
        row.title as string,
        (row.summary as string | null) ?? null,
      );
      if (code) updates.push({ id: row.id as string, country_code: code });
    }

    if (!dry && updates.length > 0) {
      // Parallel lightweight UPDATEs (Supabase doesn't support multi-row
      // UPDATE from a values list via supabase-js, so per-row is the
      // cleanest path). Limit concurrency to keep pg happy.
      const CONCURRENCY = 20;
      for (let i = 0; i < updates.length; i += CONCURRENCY) {
        const slice = updates.slice(i, i + CONCURRENCY);
        await Promise.all(
          slice.map((u) =>
            db.from("events").update({ country_code: u.country_code }).eq("id", u.id),
          ),
        );
      }
    }

    processed += rows.length;
    tagged += updates.length;
    cursor = rows[rows.length - 1].id as string;

    // Yield to the runtime so we don't hog the function invocation for
    // the full 300s on trivial passes.
    if (rows.length < batch) {
      return NextResponse.json({
        status: "done",
        done: true,
        processed,
        tagged,
        dry,
      });
    }
  }

  return NextResponse.json({
    status: "ok",
    done: false,
    processed,
    tagged,
    dry,
    hint: "call again with the same params to continue",
  });
}
