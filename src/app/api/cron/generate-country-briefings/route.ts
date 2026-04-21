/**
 * POST /api/cron/generate-country-briefings
 *
 * Nightly job — for every country that has fresh events in the last 24h,
 * generate a briefing via LLM and upsert into public.country_briefings.
 * Scheduled at 06:00 UTC (see vercel.json) — early enough that the 07:00
 * send-daily-briefings cron finds all rows ready.
 *
 * Auth: Bearer CRON_SECRET header (required by middleware tier list, also
 * enforced in-handler as defense in depth).
 *
 * Scaling: ~100 LLM calls on a busy day, well under Groq's free tier.
 * Each generation takes ~2-4s; total wall clock ~3-5 minutes with the
 * sequential await. We stay sequential to avoid the 10k tokens/sec
 * rate limit — parallelising tripped the limiter on a dry run.
 */

import { NextResponse } from "next/server";
import {
  activeCountries,
  generateCountryBriefing,
} from "@/lib/briefings/generate-country";
import { createServerClient } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes ceiling

function requireCron(req: Request): NextResponse | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(req: Request) {
  const guard = requireCron(req);
  if (guard) return guard;

  const url = new URL(req.url);
  const targetDate =
    url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const limit = Number(url.searchParams.get("limit") || "200");

  const countries = (await activeCountries()).slice(0, limit);
  const db = createServerClient();

  const results: Array<{ country: string; status: string; ms?: number }> = [];
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const country of countries) {
    try {
      const brief = await generateCountryBriefing(country, { date: targetDate });
      if (!brief) {
        skipped++;
        results.push({ country, status: "no-events" });
        continue;
      }
      const { error } = await db.from("country_briefings").upsert(
        {
          country_code: brief.country_code,
          date: brief.date,
          locale: brief.locale,
          content: brief.content,
          event_count: brief.event_count,
          top_severity: brief.top_severity,
          generation_ms: brief.generation_ms,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "country_code,date,locale" },
      );
      if (error) throw new Error(error.message);
      generated++;
      results.push({ country, status: "ok", ms: brief.generation_ms });
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[country-briefings] ${country} failed:`, message);
      results.push({ country, status: `error: ${message.slice(0, 80)}` });
    }
  }

  return NextResponse.json({
    status: "ok",
    date: targetDate,
    attempted: countries.length,
    generated,
    skipped,
    failed,
    results: results.slice(0, 50), // keep payload small
  });
}

export const GET = POST;
