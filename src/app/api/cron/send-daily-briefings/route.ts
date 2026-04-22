/**
 * POST /api/cron/send-daily-briefings
 *
 * Reads every Gaia subscriber with daily_enabled=true and at least one
 * country selected, assembles a per-user email from today's country
 * briefings, and sends it via Resend.
 *
 * Scheduled at 07:00 UTC (one hour after generate-country-briefings).
 * Sequential send keeps us under Resend's 10 req/s free-plan limit;
 * upgrade to batch endpoint when we pass a few hundred subscribers.
 *
 * Idempotent: records last_daily_sent_at and skips users already sent
 * today, so a re-run (manual or accidental) won't double-send.
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
  locale: string;
  unsubscribe_token: string;
  last_daily_sent_at: string | null;
  quiet_hours_enabled: boolean;
  quiet_start: string; // "HH:MM:SS"
  quiet_end: string;
  timezone: string;
  user_profiles: { email: string; display_name: string | null } | null;
}

/**
 * Returns true when "now, expressed in the user's timezone" falls inside
 * their quiet window. Handles windows that cross midnight (e.g. 23:00 →
 * 07:00). On a bad/unknown IANA zone we fall back to UTC so we don't
 * silently swallow a cron.
 */
function isQuietNow(pref: PrefRow): boolean {
  if (!pref.quiet_hours_enabled) return false;
  const tz = pref.timezone || "UTC";
  const now = new Date();
  let localHM: string;
  try {
    // Intl handles DST; pull HH:MM
    localHM = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(now);
  } catch (err) {
    console.error("[cron/send-daily-briefings]", err);
    localHM = new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(now);
  }
  const [hh, mm] = localHM.split(":").map(Number);
  const nowMin = hh * 60 + mm;
  const [sh, sm] = pref.quiet_start.split(":").map(Number);
  const [eh, em] = pref.quiet_end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (startMin === endMin) return false; // empty window
  // Overnight window (e.g. 23:00 → 07:00): quiet if now >= start OR now < end
  if (startMin > endMin) return nowMin >= startMin || nowMin < endMin;
  // Same-day window: quiet if start <= now < end
  return nowMin >= startMin && nowMin < endMin;
}

interface CountryBriefingRow {
  country_code: string;
  content: string;
  event_count: number;
  top_severity: string | null;
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

export async function POST(req: Request) {
  const guard = requireCron(req);
  if (guard) return guard;

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry") === "1";
  const today = new Date().toISOString().slice(0, 10);
  const db = createServerClient();

  // Pull prefs joined with profile joined with active subscription.
  // Two queries to keep the SQL readable; volume is small (hundreds,
  // not thousands, for the foreseeable future).
  const { data: prefs, error: prefErr } = await db
    .from("briefing_preferences")
    .select(
      "id, user_profile_id, country_codes, locale, unsubscribe_token, last_daily_sent_at, quiet_hours_enabled, quiet_start, quiet_end, timezone, user_profiles(email, display_name)",
    )
    .eq("daily_enabled", true);

  if (prefErr) {
    return NextResponse.json({ error: prefErr.message }, { status: 500 });
  }

  const eligibleIds = (prefs as unknown as PrefRow[]).filter(
    (p) =>
      p.country_codes.length > 0 &&
      p.user_profiles?.email &&
      (p.last_daily_sent_at?.slice(0, 10) ?? "") < today &&
      !isQuietNow(p),
  );

  if (eligibleIds.length === 0) {
    return NextResponse.json({ status: "ok", sent: 0, reason: "no eligible subs" });
  }

  // Check active Gaia subscription in bulk
  const profileIds = eligibleIds.map((p) => p.user_profile_id);
  const { data: activeSubs } = await db
    .from("subscriptions")
    .select("user_id")
    .in("user_id", profileIds)
    .eq("status", "active")
    .in("plan", ["global"]);
  const activeProfileIds = new Set((activeSubs ?? []).map((r) => r.user_id));

  const subscribers = eligibleIds.filter((p) => activeProfileIds.has(p.user_profile_id));
  if (subscribers.length === 0) {
    return NextResponse.json({
      status: "ok",
      sent: 0,
      reason: "no active Gaia subscribers ready to send",
    });
  }

  // Fetch today's country briefings in one query for every country any
  // subscriber cares about
  const allCountries = [...new Set(subscribers.flatMap((p) => p.country_codes))];
  const { data: briefings } = await db
    .from("country_briefings")
    .select("country_code, content, event_count, top_severity")
    .in("country_code", allCountries)
    .eq("date", today)
    .eq("locale", "en");

  const briefingByCountry = new Map<string, CountryBriefingRow>();
  for (const b of (briefings as CountryBriefingRow[]) ?? []) {
    briefingByCountry.set(b.country_code, b);
  }

  let sent = 0;
  let skipped = 0;
  const errors: { profile_id: string; reason: string }[] = [];

  for (const sub of subscribers) {
    try {
      const sections = sub.country_codes
        .map((code) => {
          const row = briefingByCountry.get(code);
          if (!row) return null;
          return {
            country_code: code,
            country_name:
              COUNTRY_MAP.get(code)?.name ?? code,
            content: row.content,
            event_count: row.event_count,
            top_severity: row.top_severity,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);

      if (sections.length === 0) {
        skipped++;
        continue;
      }

      const recipient = sub.user_profiles!;
      const { subject, html } = renderBriefingEmail({
        kind: "daily",
        date: today,
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
          .update({ last_daily_sent_at: new Date().toISOString() })
          .eq("id", sub.id);
      }
      sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ profile_id: sub.user_profile_id, reason: message.slice(0, 120) });
    }
  }

  return NextResponse.json({
    status: "ok",
    date: today,
    sent,
    skipped,
    failed: errors.length,
    dryRun,
    errors: errors.slice(0, 20),
  });
}

export const GET = POST;
