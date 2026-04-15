import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export const runtime = "edge";

/**
 * GET /api/newsletter/me?email=...
 *
 * Returns the subscriber's referral state for the /briefing/referrals
 * dashboard. Email is a soft-identifier — anyone who knows the email
 * can look it up, but the response exposes nothing sensitive beyond
 * public referral stats. This keeps the UX friction-free (no magic
 * links, no passwords) while the leak-surface stays minimal.
 *
 * Returns 404 if the email is not subscribed.
 */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "email query param required" },
      { status: 400 },
    );
  }

  const db = getSupabase();
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  const { data: sub } = await db
    .from("newsletter_subscribers")
    .select("email, referral_code, referral_count, frequency, subscribed_at, is_active")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (!sub) {
    return NextResponse.json(
      { found: false, error: "Not subscribed" },
      { status: 404 },
    );
  }

  // Compute leaderboard rank via a count query
  const { count: aheadCount } = await db
    .from("newsletter_subscribers")
    .select("email", { count: "exact", head: true })
    .gt("referral_count", sub.referral_count)
    .eq("is_active", true);

  const rank = (aheadCount ?? 0) + 1;

  return NextResponse.json({
    found: true,
    email: sub.email,
    referralCode: sub.referral_code,
    referralCount: sub.referral_count,
    frequency: sub.frequency,
    subscribedAt: sub.subscribed_at,
    rank,
  });
}
