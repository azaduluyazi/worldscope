import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";

export const runtime = "nodejs";

export interface DigestPreferences {
  categories: string[];
  minSeverity: string;
  maxItems: number;
}

const VALID_CATEGORIES = [
  "conflict", "finance", "cyber", "tech", "weather",
  "aviation", "energy", "diplomacy", "health", "sports",
];

const VALID_SEVERITIES = ["all", "medium", "high", "critical"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePreferences(prefs: unknown): DigestPreferences | null {
  if (typeof prefs !== "object" || prefs === null) return null;
  const obj = prefs as Record<string, unknown>;

  const categories = Array.isArray(obj.categories)
    ? obj.categories.filter((c): c is string => typeof c === "string" && VALID_CATEGORIES.includes(c))
    : VALID_CATEGORIES;

  const minSeverity =
    typeof obj.minSeverity === "string" && VALID_SEVERITIES.includes(obj.minSeverity)
      ? obj.minSeverity
      : "all";

  const maxItems =
    typeof obj.maxItems === "number" && obj.maxItems >= 10 && obj.maxItems <= 100
      ? Math.round(obj.maxItems)
      : 50;

  return { categories, minSeverity, maxItems };
}

/**
 * GET /api/digest/preferences?email=xxx
 * Returns current digest preferences for a subscriber.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const db = createServerClient();

    // Try reading from newsletter_subscribers.preferences column first
    const { data, error } = await db
      .from("newsletter_subscribers")
      .select("email, preferences")
      .eq("email", email.toLowerCase())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Subscriber not found or not active" },
        { status: 404 }
      );
    }

    // Default preferences if none saved
    const defaults: DigestPreferences = {
      categories: VALID_CATEGORIES,
      minSeverity: "all",
      maxItems: 50,
    };

    const preferences = data.preferences
      ? validatePreferences(data.preferences) || defaults
      : defaults;

    return NextResponse.json({ email: data.email, preferences });
  } catch (e) {
    console.error("[Digest Preferences] GET error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/digest/preferences
 * Save digest preferences for a subscriber.
 * Body: { email: string, preferences: DigestPreferences }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email;
    const preferences = body?.preferences;

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const validated = validatePreferences(preferences);
    if (!validated) {
      return NextResponse.json(
        { error: "Invalid preferences format" },
        { status: 400 }
      );
    }

    const db = createServerClient();

    // Verify subscriber exists and is active
    const { data: subscriber, error: findError } = await db
      .from("newsletter_subscribers")
      .select("email")
      .eq("email", email.toLowerCase())
      .eq("is_active", true)
      .single();

    if (findError || !subscriber) {
      return NextResponse.json(
        { error: "Subscriber not found. Please subscribe first." },
        { status: 404 }
      );
    }

    // Update preferences column on the subscriber row
    const { error: updateError } = await db
      .from("newsletter_subscribers")
      .update({ preferences: validated })
      .eq("email", email.toLowerCase());

    if (updateError) {
      console.error("[Digest Preferences] Update error:", updateError);
      return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
    }

    return NextResponse.json({ success: true, email: email.toLowerCase(), preferences: validated });
  } catch (e) {
    console.error("[Digest Preferences] POST error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
