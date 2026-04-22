import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { checkStrictRateLimit } from "@/lib/middleware/rate-limit";

/**
 * POST /api/alerts/telegram — Subscribe a Telegram chat to intelligence alerts.
 *
 * Body: { chat_id: string, categories?: string[], min_severity?: string }
 *
 * The Telegram bot workflow:
 * 1. User sends /start to the WorldScope bot
 * 2. Bot replies with chat_id
 * 3. User submits chat_id here to subscribe
 * 4. Alert cron checks subscribers and sends matching events
 *
 * GET /api/alerts/telegram?chat_id=xxx — Get subscription status
 * DELETE /api/alerts/telegram — Unsubscribe
 */

export async function POST(request: NextRequest) {
  const rl = await checkStrictRateLimit(request);
  if (rl) return rl;
  try {
    const body = await request.json();
    const chatId = body.chat_id;
    if (!chatId) {
      return NextResponse.json({ error: "chat_id required" }, { status: 400 });
    }

    const categories = body.categories || [
      "conflict",
      "cyber",
      "natural",
      "health",
    ];
    const minSeverity = body.min_severity || "high";

    const db = createServerClient();
    const { error } = await db.from("telegram_subscribers").upsert(
      {
        chat_id: String(chatId),
        categories,
        min_severity: minSeverity,
        is_active: true,
        subscribed_at: new Date().toISOString(),
      },
      { onConflict: "chat_id" }
    );

    if (error) {
      return NextResponse.json(
        { error: `DB error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      chat_id: chatId,
      categories,
      min_severity: minSeverity,
      message: "Subscribed! You will receive alerts for matching events.",
    });
  } catch (err) {
    console.error("[alerts/telegram]", err);
    return NextResponse.json(
      { error: "Subscription failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const chatId = request.nextUrl.searchParams.get("chat_id");
  if (!chatId) {
    return NextResponse.json({ error: "chat_id required" }, { status: 400 });
  }

  try {
    const db = createServerClient();
    const { data } = await db
      .from("telegram_subscribers")
      .select("*")
      .eq("chat_id", chatId)
      .single();

    if (!data) {
      return NextResponse.json({ subscribed: false });
    }

    return NextResponse.json({
      subscribed: true,
      categories: data.categories,
      min_severity: data.min_severity,
      is_active: data.is_active,
    });
  } catch (err) {
    console.error("[alerts/telegram]", err);
    return NextResponse.json({ subscribed: false });
  }
}

export async function DELETE(request: NextRequest) {
  const rl = await checkStrictRateLimit(request);
  if (rl) return rl;
  try {
    const body = await request.json();
    const chatId = body.chat_id;
    if (!chatId) {
      return NextResponse.json({ error: "chat_id required" }, { status: 400 });
    }

    const db = createServerClient();
    await db
      .from("telegram_subscribers")
      .update({ is_active: false })
      .eq("chat_id", String(chatId));

    return NextResponse.json({ success: true, message: "Unsubscribed" });
  } catch (err) {
    console.error("[alerts/telegram]", err);
    return NextResponse.json(
      { error: "Unsubscribe failed" },
      { status: 500 }
    );
  }
}
