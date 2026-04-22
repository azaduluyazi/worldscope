import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { checkStrictRateLimit } from "@/lib/middleware/rate-limit";

export const runtime = "nodejs";

function isAdmin(request: Request): boolean {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return false;
  return request.headers.get("authorization") === `Bearer ${adminKey}`;
}

/** POST /api/subscribe — subscribe email for digest */
export async function POST(request: Request) {
  const rl = await checkStrictRateLimit(request);
  if (rl) return rl;
  try {
    const body = await request.json();
    const { email, frequency, categories } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const freq = frequency === "weekly" ? "weekly" : "daily";
    const validCats = Array.isArray(categories)
      ? categories.filter((c: string) => typeof c === "string")
      : [];

    const db = createServerClient();
    // Table is `newsletter_subscribers` (the `email_subscribers` name in
    // old code was a column-drift bug — that table never existed).
    // Categories live in the `preferences` Json column, not as a top-level
    // field (schema-confirmed via Database type).
    const { data, error } = await db
      .from("newsletter_subscribers")
      .upsert(
        {
          email: email.toLowerCase().trim(),
          frequency: freq,
          is_active: true,
          preferences: { categories: validCats },
        },
        { onConflict: "email" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ subscriber: data }, { status: 201 });
  } catch (err) {
    console.error("[subscribe POST] unexpected:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

/** DELETE /api/subscribe?email=xxx — admin-only unsubscribe (legacy endpoint) */
export async function DELETE(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) return NextResponse.json({ error: "email parameter required" }, { status: 400 });

    const db = createServerClient();
    const { error } = await db
      .from("newsletter_subscribers")
      .update({ is_active: false })
      .eq("email", email.toLowerCase().trim());

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ unsubscribed: true });
  } catch (err) {
    console.error("[subscribe DELETE] unexpected:", err);
    return NextResponse.json({ error: "Unsubscribe failed" }, { status: 500 });
  }
}
