import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { postSignal, type TelegramSignal } from "@/lib/telegram/poster";

export const runtime = "nodejs";

/**
 * GET /api/cron/telegram-signals
 *
 * Cron-triggered every 15 minutes (vercel.json). Posts up to 2 fresh
 * high-confidence convergence events per run (8/hour, ~50/day max).
 *
 * Auth: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  // Fetch high-confidence storylines from the last hour that haven't been
  // posted to Telegram yet (tracked via a `posted_to_telegram_at` column).
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: stories, error } = await supabase
    .from("convergence_storylines")
    .select(
      "id, title, regions, source_count, confidence, created_at, posted_to_telegram_at",
    )
    .is("posted_to_telegram_at", null)
    .gte("created_at", oneHourAgo)
    .gte("confidence", 0.85)
    .order("confidence", { ascending: false })
    .limit(2);

  if (error) {
    return NextResponse.json(
      { error: error.message, posted: 0 },
      { status: 500 },
    );
  }

  if (!stories || stories.length === 0) {
    return NextResponse.json({ ok: true, posted: 0, reason: "no new high-confidence stories" });
  }

  let postedCount = 0;
  const failures: string[] = [];

  for (const story of stories) {
    const signal: TelegramSignal = {
      id: story.id,
      variant: "convergence",
      headline: story.title,
      sourceCount: story.source_count,
      confidence: story.confidence,
      region: (story.regions || []).join(", ") || "Global",
      timestamp: new Date(story.created_at).toISOString().slice(0, 16) + " UTC",
    };

    const success = await postSignal(signal);

    if (success) {
      postedCount++;
      // Mark as posted so we don't repost
      await supabase
        .from("convergence_storylines")
        .update({ posted_to_telegram_at: new Date().toISOString() })
        .eq("id", story.id);
    } else {
      failures.push(story.id);
    }
  }

  return NextResponse.json({
    ok: true,
    posted: postedCount,
    failures: failures.length,
    failed_ids: failures,
  });
}
