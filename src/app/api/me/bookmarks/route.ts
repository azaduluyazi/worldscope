/**
 * /api/me/bookmarks — signed-in user's saved events.
 *
 *   GET    → list (with event snapshot joined)
 *   POST   → add { eventId, note? }
 *   DELETE → remove ?eventId=
 *
 * Uses the bookmarks table (migration 005). Scoped by user_profiles.id
 * resolved from the Clerk auth_id so a user can only read/modify their
 * own rows. Webhook sync on first sign-in ensures user_profiles exists.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServerClient } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireProfileId(): Promise<string | NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "sign-in required" }, { status: 401 });
  }
  const db = createServerClient();
  const { data, error } = await db
    .from("user_profiles")
    .select("id")
    .eq("auth_id", userId)
    .maybeSingle();
  if (error) {
    console.error("[bookmarks] profile lookup failed", error);
    return NextResponse.json({ error: "profile lookup failed" }, { status: 500 });
  }
  if (!data) {
    // Webhook hasn't synced yet — treat as "not ready".
    return NextResponse.json({ error: "profile not synced yet" }, { status: 409 });
  }
  return data.id as string;
}

export async function GET() {
  const profileOrErr = await requireProfileId();
  if (profileOrErr instanceof NextResponse) return profileOrErr;

  const db = createServerClient();
  const { data, error } = await db
    .from("bookmarks")
    .select(
      "id, note, created_at, event_id, events:events!bookmarks_event_id_fkey(id, title, severity, category, source, url, country_code, published_at)",
    )
    .eq("user_id", profileOrErr)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[bookmarks] list failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ bookmarks: data ?? [] });
}

const PostSchema = z.object({
  eventId: z.string().uuid(),
  note: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const profileOrErr = await requireProfileId();
  if (profileOrErr instanceof NextResponse) return profileOrErr;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = createServerClient();
  const { data, error } = await db
    .from("bookmarks")
    .upsert(
      {
        user_id: profileOrErr,
        event_id: parsed.data.eventId,
        note: parsed.data.note ?? null,
      },
      { onConflict: "user_id,event_id" },
    )
    .select("id")
    .single();

  if (error) {
    console.error("[bookmarks] upsert failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ status: "ok", id: data.id });
}

export async function DELETE(req: Request) {
  const profileOrErr = await requireProfileId();
  if (profileOrErr instanceof NextResponse) return profileOrErr;

  const url = new URL(req.url);
  const eventId = url.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  const db = createServerClient();
  const { error } = await db
    .from("bookmarks")
    .delete()
    .eq("user_id", profileOrErr)
    .eq("event_id", eventId);

  if (error) {
    console.error("[bookmarks] delete failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ status: "ok" });
}
