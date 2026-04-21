/**
 * /api/me/preferences — subscriber's briefing preferences.
 *
 *   GET — returns the row (or zero-state defaults if none exists yet)
 *   PUT — upserts country_codes + daily_enabled + weekly_enabled + locale
 *
 * Auth: signed-in Supabase user. Tier gate is intentionally NOT enforced
 * here — free users can set preferences in advance of subscribing, we
 * just won't send them emails until Gaia is active (see send-daily-
 * briefings subscription check).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/db/supabase-server";
import { createServerClient } from "@/lib/db/supabase";
import { COUNTRY_MAP } from "@/config/countries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PutSchema = z.object({
  country_codes: z
    .array(z.string().regex(/^[A-Z]{2}$/))
    .min(0)
    .max(15)
    .refine(
      (codes) => codes.every((c) => COUNTRY_MAP.has(c)),
      { message: "unknown country code" },
    ),
  daily_enabled: z.boolean(),
  weekly_enabled: z.boolean(),
  locale: z.enum(["en", "tr"]),
});

async function requireProfile() {
  const user = await getCurrentUser();
  if (!user) return { err: NextResponse.json({ error: "sign-in required" }, { status: 401 }) };
  const db = createServerClient();
  const { data: profile, error } = await db
    .from("user_profiles")
    .select("id, email")
    .eq("auth_id", user.id)
    .maybeSingle();
  if (error || !profile)
    return { err: NextResponse.json({ error: "profile missing" }, { status: 500 }) };
  return { profile, db };
}

export async function GET() {
  const { err, profile, db } = await requireProfile();
  if (err) return err;

  const { data } = await db!
    .from("briefing_preferences")
    .select(
      "country_codes, daily_enabled, weekly_enabled, locale, last_daily_sent_at, last_weekly_sent_at",
    )
    .eq("user_profile_id", profile!.id)
    .maybeSingle();

  return NextResponse.json(
    data ?? {
      country_codes: [],
      daily_enabled: true,
      weekly_enabled: false,
      locale: "en",
      last_daily_sent_at: null,
      last_weekly_sent_at: null,
    },
  );
}

export async function PUT(req: Request) {
  const { err, profile, db } = await requireProfile();
  if (err) return err;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = PutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = {
    user_profile_id: profile!.id,
    country_codes: parsed.data.country_codes,
    daily_enabled: parsed.data.daily_enabled,
    weekly_enabled: parsed.data.weekly_enabled,
    locale: parsed.data.locale,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertErr } = await db!
    .from("briefing_preferences")
    .upsert(payload, { onConflict: "user_profile_id" });
  if (upsertErr) {
    console.error("[preferences] upsert failed", upsertErr);
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }
  return NextResponse.json({ status: "ok" });
}
