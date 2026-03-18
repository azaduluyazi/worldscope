import { createServerClient } from "@/lib/db/supabase";
import type { IntelItem, Severity } from "@/types/intel";

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0, high: 1, medium: 2, low: 3, info: 4,
};

interface Webhook {
  id: string;
  url: string;
  categories: string[];
  min_severity: string;
}

/** Deliver alerts to active webhook subscribers */
export async function deliverWebhooks(items: IntelItem[]): Promise<{ sent: number; failed: number }> {
  if (items.length === 0) return { sent: 0, failed: 0 };

  const db = createServerClient();
  const { data: webhooks } = await db
    .from("webhooks")
    .select("id, url, categories, min_severity")
    .eq("is_active", true)
    .lt("error_count", 5);

  if (!webhooks || webhooks.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const wh of webhooks as Webhook[]) {
    // Filter items matching this webhook's criteria
    const minSevIdx = SEVERITY_ORDER[wh.min_severity as Severity] ?? 1;
    const matching = items.filter((item) => {
      const sevIdx = SEVERITY_ORDER[item.severity] ?? 4;
      if (sevIdx > minSevIdx) return false;
      if (wh.categories.length > 0 && !wh.categories.includes(item.category)) return false;
      return true;
    });

    if (matching.length === 0) continue;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(wh.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "WorldScope-Webhook/1.0" },
        body: JSON.stringify({
          source: "worldscope",
          timestamp: new Date().toISOString(),
          events: matching.slice(0, 20).map((i) => ({
            id: i.id,
            title: i.title,
            category: i.category,
            severity: i.severity,
            source: i.source,
            publishedAt: i.publishedAt,
            url: i.url,
            countryCode: i.countryCode,
          })),
          total: matching.length,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        sent++;
        await db.from("webhooks").update({ last_triggered_at: new Date().toISOString(), error_count: 0 }).eq("id", wh.id);
      } else {
        failed++;
        // Increment error count — deactivates at 5 via cron validation
        const { data: current } = await db.from("webhooks").select("error_count").eq("id", wh.id).single();
        const newCount = ((current?.error_count as number) || 0) + 1;
        await db.from("webhooks").update({ error_count: newCount, is_active: newCount < 5 }).eq("id", wh.id);
      }
    } catch {
      failed++;
    }
  }

  return { sent, failed };
}
