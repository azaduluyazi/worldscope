import { createServerClient } from "./supabase";

/**
 * Increment error count for a feed.
 * Auto-deactivates feeds with 5+ consecutive errors.
 */
export async function recordFeedError(feedUrl: string): Promise<void> {
  const db = createServerClient();

  // Increment error_count and auto-deactivate at threshold
  const { data } = await db
    .from("feeds")
    .select("id, error_count")
    .eq("url", feedUrl)
    .single();

  if (!data) return;

  const newCount = (data.error_count || 0) + 1;
  await db
    .from("feeds")
    .update({
      error_count: newCount,
      is_active: newCount < 5, // Auto-deactivate at 5 errors
    })
    .eq("id", data.id);
}

/**
 * Mark a feed as successfully fetched — reset error count.
 */
export async function recordFeedSuccess(feedUrl: string): Promise<void> {
  const db = createServerClient();

  await db
    .from("feeds")
    .update({
      error_count: 0,
      last_fetched_at: new Date().toISOString(),
    })
    .eq("url", feedUrl);
}

/**
 * Get feed health summary for monitoring dashboard.
 */
export async function getFeedHealthSummary(): Promise<{
  total: number;
  active: number;
  unhealthy: number;
  deactivated: number;
  byCategory: Record<string, { active: number; total: number }>;
}> {
  const db = createServerClient();
  const { data } = await db
    .from("feeds")
    .select("category, is_active, error_count");

  if (!data) return { total: 0, active: 0, unhealthy: 0, deactivated: 0, byCategory: {} };

  const byCategory: Record<string, { active: number; total: number }> = {};
  let active = 0;
  let unhealthy = 0;
  let deactivated = 0;

  for (const feed of data) {
    if (!byCategory[feed.category]) {
      byCategory[feed.category] = { active: 0, total: 0 };
    }
    byCategory[feed.category].total++;

    if (feed.is_active) {
      active++;
      byCategory[feed.category].active++;
      if (feed.error_count >= 3) unhealthy++;
    } else {
      deactivated++;
    }
  }

  return { total: data.length, active, unhealthy, deactivated, byCategory };
}
