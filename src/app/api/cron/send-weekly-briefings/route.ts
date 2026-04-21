/**
 * POST /api/cron/send-weekly-briefings
 *
 * Monday 08:00 UTC rollup. For each Gaia subscriber with
 * weekly_enabled=true, pulls the last 7 days of country_briefings rows
 * for their selected countries, concatenates the markdown into a single
 * "week at a glance" section per country (one bullet list of the
 * week's daily framing sentences + top events), and sends via Resend.
 *
 * We deliberately *don't* re-run the LLM here — weekly is a roll-up of
 * existing country_briefings rows. Keeps weekly cron fast and cheap.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { COUNTRY_MAP } from "@/config/countries";
import { renderBriefingEmail } from "@/lib/briefings/render-email";
import { sendMail } from "@/lib/mail/sender";

export const runtime = "nodejs";
export const maxDuration = 300;

interface PrefRow {
  id: string;
  user_profile_id: string;
  country_codes: string[];
  unsubscribe_token: string;
  last_weekly_sent_at: string | null;
  user_profiles: { email: string; display_name: string | null } | null;
}

function requireCron(req: Request): NextResponse | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://troiamedia.com";

function rollupMarkdown(
  briefings: { date: string; content: string; event_count: number }[],
): { content: string; totalEvents: number } {
  // Each briefing: "framing sentence\n- bullet\n- bullet…"
  // Weekly rollup: one line per day with the framing sentence + total,
  // then a collapsed list of all bullets.
  const lines: string[] = [];
  let totalEvents = 0;
  const allBullets: string[] = [];

  for (const b of briefings) {
    totalEvents += b.event_count;
    const parts = b.content.split(/\r?\n/);
    const framing = parts.find((p) => p && !p.startsWith("-"))?.trim() ?? "";
    const bullets = parts.filter((p) => p.startsWith("- "));
    lines.push(`- **${b.date}** (${b.event_count} events): ${framing}`);
    allBullets.push(...bullets);
  }

  // De-duplicate bullets by their first 80 chars to avoid repetition
  // when a multi-day story carries forward.
  const seen = new Set<string>();
  const deduped = allBullets.filter((b) => {
    const key = b.slice(0, 80).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const content = [
    "## Day by day",
    ...lines,
    "",
    "## Top events this week",
    ...deduped.slice(0, 12),
  ].join("\n");

  return { content, totalEvents };
}

export async function POST(req: Request) {
  const guard = requireCron(req);
  if (guard) return guard;

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry") === "1";
  const today = new Date();
  const weekEnd = today.toISOString().slice(0, 10);
  const weekStart = new Date(today.getTime() - 7 * 86400_000).toISOString().slice(0, 10);

  const db = createServerClient();

  const { data: prefs, error } = await db
    .from("briefing_preferences")
    .select(
      "id, user_profile_id, country_codes, unsubscribe_token, last_weekly_sent_at, user_profiles(email, display_name)",
    )
    .eq("weekly_enabled", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const eligible = (prefs as unknown as PrefRow[]).filter(
    (p) =>
      p.country_codes.length > 0 &&
      p.user_profiles?.email &&
      (p.last_weekly_sent_at ?? "") < `${weekEnd}T00:00:00`,
  );

  if (eligible.length === 0) {
    return NextResponse.json({ status: "ok", sent: 0 });
  }

  // Active Gaia check (same pattern as daily cron)
  const profileIds = eligible.map((p) => p.user_profile_id);
  const { data: activeSubs } = await db
    .from("subscriptions")
    .select("user_id")
    .in("user_id", profileIds)
    .eq("status", "active")
    .eq("plan", "global");
  const activeIds = new Set((activeSubs ?? []).map((r) => r.user_id));
  const subscribers = eligible.filter((p) => activeIds.has(p.user_profile_id));

  // Bulk fetch: all country_briefings in the week window for any country
  // any subscriber selected.
  const allCountries = [...new Set(subscribers.flatMap((p) => p.country_codes))];
  const { data: briefings } = await db
    .from("country_briefings")
    .select("country_code, date, content, event_count, top_severity")
    .in("country_code", allCountries)
    .gte("date", weekStart)
    .lte("date", weekEnd)
    .eq("locale", "en")
    .order("date", { ascending: true });

  const byCountry = new Map<
    string,
    { date: string; content: string; event_count: number; top_severity: string | null }[]
  >();
  for (const b of briefings ?? []) {
    const list = byCountry.get(b.country_code) ?? [];
    list.push(b);
    byCountry.set(b.country_code, list);
  }

  let sent = 0;
  let skipped = 0;
  const errors: { profile_id: string; reason: string }[] = [];

  for (const sub of subscribers) {
    try {
      const sections = sub.country_codes
        .map((code) => {
          const list = byCountry.get(code);
          if (!list || list.length === 0) return null;
          const { content, totalEvents } = rollupMarkdown(list);
          // Use max severity of the week
          const topSev = list.reduce<string | null>((acc, b) => {
            const order = ["info", "low", "medium", "high", "critical"];
            if (!b.top_severity) return acc;
            if (!acc) return b.top_severity;
            return order.indexOf(b.top_severity) > order.indexOf(acc) ? b.top_severity : acc;
          }, null);
          return {
            country_code: code,
            country_name: COUNTRY_MAP.get(code)?.name ?? code,
            content,
            event_count: totalEvents,
            top_severity: topSev,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);

      if (sections.length === 0) {
        skipped++;
        continue;
      }

      const recipient = sub.user_profiles!;
      const { subject, html } = renderBriefingEmail({
        kind: "weekly",
        date: weekEnd,
        recipient_name: recipient.display_name || recipient.email.split("@")[0],
        countries: sections,
        preferences_url: `${SITE}/account#briefing-preferences`,
        unsubscribe_url: `${SITE}/unsubscribe?token=${sub.unsubscribe_token}`,
      });

      if (!dryRun) {
        const ok = await sendMail({ to: recipient.email, subject, html });
        if (!ok) throw new Error("sendMail returned false");
        await db
          .from("briefing_preferences")
          .update({ last_weekly_sent_at: new Date().toISOString() })
          .eq("id", sub.id);
      }
      sent++;
    } catch (err) {
      errors.push({
        profile_id: sub.user_profile_id,
        reason: (err instanceof Error ? err.message : String(err)).slice(0, 120),
      });
    }
  }

  return NextResponse.json({
    status: "ok",
    weekStart,
    weekEnd,
    sent,
    skipped,
    failed: errors.length,
    dryRun,
    errors: errors.slice(0, 20),
  });
}

export const GET = POST;
