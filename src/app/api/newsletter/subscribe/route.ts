import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";
import { checkStrictRateLimit } from "@/lib/middleware/rate-limit";

export const runtime = "edge";

/**
 * POST /api/newsletter/subscribe — Subscribe to free WorldScope digest.
 *
 * Body: {
 *   email: string,
 *   frequency?: "daily" | "weekly",
 *   source?: string,
 *   ref?: string  // referral code from /briefing?ref=XXXX
 * }
 */
export async function POST(request: NextRequest) {
  const rl = await checkStrictRateLimit(request);
  if (rl) return rl;
  try {
    const {
      email,
      frequency = "daily",
      source,
      ref,
    } = (await request.json()) as {
      email?: string;
      frequency?: string;
      source?: string;
      ref?: string;
    };

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    if (!["daily", "weekly"].includes(frequency)) {
      return NextResponse.json(
        { error: "Frequency must be 'daily' or 'weekly'" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        {
          email: normalizedEmail,
          frequency,
          subscribed_at: new Date().toISOString(),
          is_active: true,
          source: source || null,
          referred_by: ref || null,
        },
        { onConflict: "email" }
      );

    if (error) {
      console.error("Newsletter subscribe error:", error.message);
      return NextResponse.json(
        { success: true, message: "Subscription recorded" }
      );
    }

    // ── Referral tracking ──
    // If a valid referral code was passed AND the new sub is not the referrer
    // themselves, log it in newsletter_referrals (trigger bumps the count).
    if (ref) {
      try {
        const { data: referrer } = await supabase
          .from("newsletter_subscribers")
          .select("email")
          .eq("referral_code", ref)
          .maybeSingle();

        if (referrer && referrer.email !== normalizedEmail) {
          await supabase.from("newsletter_referrals").insert({
            referrer_email: referrer.email,
            referee_email: normalizedEmail,
          });
        }
      } catch (e) {
        // Don't fail the subscription if referral logging fails
        console.error(
          "Referral logging failed:",
          e instanceof Error ? e.message : String(e)
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Subscribed to ${frequency} intelligence digest`,
    });
  } catch (err) {
    console.error("[newsletter/subscribe] unexpected:", err);
    return NextResponse.json(
      { error: "Subscription failed" },
      { status: 500 }
    );
  }
}
