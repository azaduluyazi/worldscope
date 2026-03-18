import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";

export const runtime = "nodejs";

/** POST /api/subscribe — subscribe email for digest */
export async function POST(request: Request) {
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
    const { data, error } = await db
      .from("email_subscribers")
      .upsert(
        { email: email.toLowerCase().trim(), frequency: freq, categories: validCats, is_active: true },
        { onConflict: "email" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ subscriber: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

/** DELETE /api/subscribe?email=xxx — unsubscribe */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) return NextResponse.json({ error: "email parameter required" }, { status: 400 });

    const db = createServerClient();
    const { error } = await db
      .from("email_subscribers")
      .update({ is_active: false })
      .eq("email", email.toLowerCase().trim());

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ unsubscribed: true });
  } catch {
    return NextResponse.json({ error: "Unsubscribe failed" }, { status: 500 });
  }
}
