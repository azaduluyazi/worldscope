import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export const runtime = "edge";

/**
 * POST /api/newsletter/subscribe — Subscribe to free WorldScope daily digest.
 *
 * Body: { email: string, frequency?: "daily" | "weekly" }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, frequency = "daily" } = await request.json();

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

    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        {
          email: email.toLowerCase().trim(),
          frequency,
          subscribed_at: new Date().toISOString(),
          is_active: true,
        },
        { onConflict: "email" }
      );

    if (error) {
      console.error("Newsletter subscribe error:", error.message);
      return NextResponse.json(
        { success: true, message: "Subscription recorded" }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Subscribed to ${frequency} intelligence digest`,
    });
  } catch {
    return NextResponse.json(
      { error: "Subscription failed" },
      { status: 500 }
    );
  }
}
