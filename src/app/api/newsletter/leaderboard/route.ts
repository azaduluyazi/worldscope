import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export const runtime = "edge";
export const revalidate = 300;

/**
 * GET /api/newsletter/leaderboard
 *
 * Returns top 20 referrers with their emails masked for privacy.
 * Reads from the `newsletter_referral_leaderboard` view created by
 * migration 016.
 */

interface LeaderRow {
  email: string;
  referral_code: string;
  referral_count: number;
  tier: string;
  subscribed_at: string;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, 2);
  const masked = "*".repeat(Math.max(local.length - 2, 1));
  return `${visible}${masked}@${domain}`;
}

export async function GET() {
  const db = getSupabase();
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", entries: [] },
      { status: 503 },
    );
  }

  const { data, error } = await db
    .from("newsletter_referral_leaderboard")
    .select("email, referral_code, referral_count, tier, subscribed_at")
    .limit(20);

  if (error) {
    return NextResponse.json(
      { error: error.message, entries: [] },
      { status: 500 },
    );
  }

  const rows = (data as LeaderRow[]) || [];
  const entries = rows.map((row, idx) => ({
    rank: idx + 1,
    maskedEmail: maskEmail(row.email),
    referralCount: row.referral_count,
    tier: row.tier,
    subscribedAt: row.subscribed_at,
  }));

  return NextResponse.json({
    ok: true,
    entries,
    count: entries.length,
  });
}
