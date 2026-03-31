import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { rateLimiters } from "@/lib/ratelimit";

/**
 * GET /api/subscription/check?email=user@example.com
 *
 * Checks if the given email has an active newsletter subscription.
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
    return NextResponse.json({ isSubscribed: false });
  }

  try {
    const supabase = createServerClient();

    const { data: subscriber } = await supabase
      .from("newsletter_subscribers")
      .select("is_active")
      .eq("email", email.toLowerCase())
      .eq("is_active", true)
      .single();

    return NextResponse.json({ isSubscribed: !!subscriber });
  } catch {
    return NextResponse.json({ isSubscribed: false });
  }
}
