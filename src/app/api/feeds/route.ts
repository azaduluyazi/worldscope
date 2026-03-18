import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";

export const runtime = "nodejs";

const VALID_CATEGORIES = new Set([
  "conflict", "finance", "cyber", "tech", "natural",
  "aviation", "energy", "diplomacy", "protest", "health",
]);

/** GET /api/feeds — list all feeds with health status */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("active") !== "false";

    const db = createServerClient();
    let query = db
      .from("feeds")
      .select("id, url, name, category, language, is_active, last_fetched_at, error_count, created_at")
      .order("category")
      .order("name");

    if (activeOnly) {
      query = query.eq("is_active", true);
    }
    if (category && VALID_CATEGORIES.has(category)) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const healthy = (data || []).filter((f) => f.error_count < 5).length;

    return NextResponse.json({
      feeds: data || [],
      total: data?.length || 0,
      healthy,
      unhealthy: (data?.length || 0) - healthy,
    });
  } catch {
    return NextResponse.json({ feeds: [], total: 0 }, { status: 500 });
  }
}

/** POST /api/feeds — add a new feed */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, name, category, language } = body;

    if (!url || !name || !category) {
      return NextResponse.json(
        { error: "url, name, and category are required" },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.has(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${[...VALID_CATEGORIES].join(", ")}` },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const db = createServerClient();
    const { data, error } = await db
      .from("feeds")
      .upsert(
        { url, name, category, language: language || "en", is_active: true, error_count: 0 },
        { onConflict: "url" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feed: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

/** DELETE /api/feeds?id=xxx — remove a feed */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const ids = searchParams.get("ids"); // bulk delete: comma-separated

    const db = createServerClient();

    if (ids) {
      const idList = ids.split(",").map((s) => s.trim()).filter(Boolean);
      if (idList.length === 0) {
        return NextResponse.json({ error: "No valid IDs" }, { status: 400 });
      }
      const { error } = await db.from("feeds").delete().in("id", idList);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ deleted: idList.length });
    }

    if (!id) {
      return NextResponse.json({ error: "id or ids parameter required" }, { status: 400 });
    }

    const { error } = await db.from("feeds").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ deleted: 1 });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

/** PATCH /api/feeds?id=xxx — update feed (toggle active, reset errors) */
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id parameter required" }, { status: 400 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
    if (body.reset_errors) updates.error_count = 0;
    if (body.name) updates.name = body.name;
    if (body.category && VALID_CATEGORIES.has(body.category)) updates.category = body.category;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const db = createServerClient();
    const { data, error } = await db
      .from("feeds")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feed: data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
