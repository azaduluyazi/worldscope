import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { rateLimiters } from "@/lib/ratelimit";

/**
 * GET /api/subscription/check?email=user@example.com
 *
 * Checks if the given email has an active premium subscription.
 * Used by the client-side useSubscription hook to gate IPTV access.
 * Rate limited to prevent email enumeration.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { success } = await rateLimiters.strict.limit(`sub-check:${ip}`);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const email = req.nextUrl.searchParams.get("email");
  if (!email || !email.includes("@")) {
    return NextResponse.json({ isPremium: false });
  }

  try {
    const supabase = createServerClient();

    // Check newsletter_subscribers table
    const { data: subscriber } = await supabase
      .from("newsletter_subscribers")
      .select("tier, is_active")
      .eq("email", email.toLowerCase())
      .eq("is_active", true)
      .single();

    if (subscriber?.tier === "premium") {
      return NextResponse.json({ isPremium: true });
    }

    // Fallback: check subscriptions table via user_profiles email match
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (profile) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", profile.id)
        .eq("status", "active")
        .in("plan", ["pro", "enterprise"])
        .maybeSingle();

      if (subscription) {
        return NextResponse.json({ isPremium: true });
      }
    }

    return NextResponse.json({ isPremium: false });
  } catch {
    return NextResponse.json({ isPremium: false });
  }
}
