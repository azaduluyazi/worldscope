import { NextResponse } from "next/server";
import { redis } from "@/lib/cache/redis";
import { createServerClient } from "@/lib/db/supabase";

export const runtime = "nodejs";

interface ApplicationBody {
  name: string;
  email: string;
  purpose: string;
  website?: string;
}

/**
 * POST /api/developer/apply
 * Submit a developer API key application.
 * Stored as "pending" for manual admin review.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ApplicationBody;

    // ── Validate inputs ──
    if (!body.name || typeof body.name !== "string" || body.name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name is required (minimum 2 characters)" },
        { status: 400 }
      );
    }

    if (!body.email || typeof body.email !== "string" || !isValidEmail(body.email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!body.purpose || typeof body.purpose !== "string" || body.purpose.trim().length < 10) {
      return NextResponse.json(
        { error: "Purpose is required (minimum 10 characters)" },
        { status: 400 }
      );
    }

    // ── IP-based spam prevention: 3 applications per hour ──
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "anonymous";
    const rlKey = `rl:dev-apply:${ip}`;

    const count = await redis.incr(rlKey);
    if (count === 1) {
      await redis.expire(rlKey, 3600);
    }
    if (count > 3) {
      return NextResponse.json(
        { error: "Too many applications. Please try again later." },
        { status: 429 }
      );
    }

    // ── Check for existing pending/approved application ──
    const db = createServerClient();
    const { data: existing } = await db
      .from("api_keys")
      .select("id, status")
      .eq("email", body.email.trim().toLowerCase())
      .in("status", ["pending", "approved"])
      .limit(1)
      .maybeSingle();

    if (existing) {
      const msg =
        existing.status === "pending"
          ? "You already have a pending application. Please wait for review."
          : "You already have an active API key. Contact support if you need a new one.";
      return NextResponse.json({ error: msg }, { status: 409 });
    }

    // ── Insert application ──
    const { error: insertError } = await db.from("api_keys").insert({
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      purpose: body.purpose.trim(),
      website: body.website?.trim() || null,
      status: "pending",
      rate_limit: 100, // default
      request_count: 0,
      key_hash: "",
      key_prefix: "",
    });

    if (insertError) {
      console.error("[Developer Apply] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to submit application" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Application submitted successfully. You will receive an email when your application has been reviewed.",
    });
  } catch (e) {
    console.error("[Developer Apply] Error:", e);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
