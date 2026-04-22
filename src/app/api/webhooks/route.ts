import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";

export const runtime = "nodejs";

const VALID_SEVERITIES = new Set(["critical", "high", "medium", "low", "info"]);
const VALID_CATEGORIES = new Set([
  "conflict", "finance", "cyber", "tech", "natural",
  "aviation", "energy", "diplomacy", "protest", "health",
]);

/** GET /api/webhooks — list all webhooks (no auth required — public service) */
export async function GET() {
  try {
    const db = createServerClient();
    const { data, error } = await db
      .from("webhooks")
      .select("id, url, categories, min_severity, is_active, last_triggered_at, error_count, created_at")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ webhooks: data || [] });
  } catch (err) {
    console.error("[webhooks]", err);
    return NextResponse.json({ webhooks: [] }, { status: 500 });
  }
}

/** POST /api/webhooks — subscribe a new webhook */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, categories, min_severity } = body;

    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // Validate URL
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return NextResponse.json({ error: "URL must use http or https" }, { status: 400 });
      }
    } catch (err) {
      console.error("[webhooks]", err);
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Validate categories
    const validCats = (categories || []).filter((c: string) => VALID_CATEGORIES.has(c));

    // Validate severity
    const severity = min_severity && VALID_SEVERITIES.has(min_severity) ? min_severity : "high";

    const db = createServerClient();
    const { data, error } = await db
      .from("webhooks")
      .upsert(
        { url, categories: validCats, min_severity: severity, is_active: true, error_count: 0 },
        { onConflict: "url" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ webhook: data }, { status: 201 });
  } catch (err) {
    console.error("[webhooks]", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

/** DELETE /api/webhooks?id=xxx — remove a webhook */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "id parameter required" }, { status: 400 });

    const db = createServerClient();
    const { error } = await db.from("webhooks").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[webhooks]", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
