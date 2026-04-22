import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) return false;

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const db = createServerClient();

  // Find feeds not fetched in the last 24 hours
  const staleThreshold = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: staleFeeds, error: queryError } = await db
    .from("feeds")
    .select("id, url, name, error_count")
    .eq("is_active", true)
    .or(`last_fetched_at.lt.${staleThreshold},last_fetched_at.is.null`);

  if (queryError || !staleFeeds || staleFeeds.length === 0) {
    return NextResponse.json({
      success: true,
      checked: 0,
      reachable: 0,
      unreachable: 0,
      deactivated: 0,
      durationMs: Date.now() - startTime,
    });
  }

  let reachable = 0;
  let unreachable = 0;
  let deactivated = 0;

  // Validate each stale feed with a HEAD request
  const results = await Promise.allSettled(
    staleFeeds.map(async (feed) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(feed.url, {
          method: "HEAD",
          signal: controller.signal,
          headers: { "User-Agent": "WorldScope/1.0 FeedValidator" },
        });

        clearTimeout(timeout);

        if (response.ok) {
          // Feed is reachable — reset error count
          await db
            .from("feeds")
            .update({ error_count: 0 })
            .eq("id", feed.id);
          return { reachable: true, deactivated: false };
        }

        // Non-OK response — increment error count
        const newErrorCount = (feed.error_count || 0) + 1;
        const shouldDeactivate = newErrorCount >= 5;

        await db
          .from("feeds")
          .update({
            error_count: newErrorCount,
            is_active: !shouldDeactivate,
          })
          .eq("id", feed.id);

        return { reachable: false, deactivated: shouldDeactivate };
      } catch (err) {
        console.error("[cron/validate-feeds]", err);
        // Network error / timeout — increment error count
        const newErrorCount = (feed.error_count || 0) + 1;
        const shouldDeactivate = newErrorCount >= 5;

        await db
          .from("feeds")
          .update({
            error_count: newErrorCount,
            is_active: !shouldDeactivate,
          })
          .eq("id", feed.id);

        return { reachable: false, deactivated: shouldDeactivate };
      }
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value.reachable) {
        reachable++;
      } else {
        unreachable++;
        if (result.value.deactivated) deactivated++;
      }
    } else {
      unreachable++;
    }
  }

  return NextResponse.json({
    success: true,
    checked: staleFeeds.length,
    reachable,
    unreachable,
    deactivated,
    durationMs: Date.now() - startTime,
  });
}
