import { NextResponse } from "next/server";
import { fetchPersistedEvents } from "@/lib/db/events";
import { detectAnomalies } from "@/lib/utils/anomaly-detection";
import { buildDailyBriefingEmail } from "@/lib/mail/templates";
import {
  sendMail,
  getActiveSubscribersWithPrefs,
  type DigestPreferences,
} from "@/lib/mail/sender";
import type { IntelItem } from "@/types/intel";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET /api/cron/send-briefing
 * Sends daily intelligence briefing to all active subscribers (free).
 * Scheduled via Vercel cron: every day at 08:00 UTC.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Get subscribers with preferences
    const subscribers = await getActiveSubscribersWithPrefs();
    if (subscribers.length === 0) {
      return NextResponse.json({ success: true, sent: 0, reason: "No subscribers" });
    }

    // 2. Get intel data
    const allItems = await fetchPersistedEvents({ limit: 2000, hoursBack: 24 });
    const anomalies = detectAnomalies(allItems, 24, 6);

    // 3. Generate AI summary
    let aiSummary = "Daily intelligence summary unavailable.";
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://troiamedia.com"}/api/ai/brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: "en" }),
      });
      if (res.ok) {
        aiSummary = await res.text();
      }
    } catch {
      // AI summary optional — continue without it
    }

    const date = new Date().toISOString().split("T")[0];

    // 4. Group subscribers by preference signature for batching
    const SEVERITY_ORDER = ["info", "low", "medium", "high", "critical"];

    function filterItemsByPrefs(items: IntelItem[], prefs: DigestPreferences): IntelItem[] {
      let filtered = items;

      // Filter by categories
      if (prefs.categories.length > 0) {
        filtered = filtered.filter((item) => {
          const cat = item.category?.toLowerCase() || "";
          return prefs.categories.some((c) => cat.includes(c));
        });
      }

      // Filter by minimum severity
      if (prefs.minSeverity !== "all") {
        const minIdx = SEVERITY_ORDER.indexOf(prefs.minSeverity);
        if (minIdx > 0) {
          filtered = filtered.filter((item) => {
            const itemIdx = SEVERITY_ORDER.indexOf(item.severity || "info");
            return itemIdx >= minIdx;
          });
        }
      }

      // Limit items
      return filtered.slice(0, prefs.maxItems);
    }

    function prefsKey(prefs?: DigestPreferences): string {
      if (!prefs) return "default";
      return `${prefs.categories.sort().join(",")}_${prefs.minSeverity}_${prefs.maxItems}`;
    }

    // Group subscribers by their preference signature
    const groups = new Map<string, { prefs?: DigestPreferences; emails: string[] }>();
    for (const sub of subscribers) {
      const key = prefsKey(sub.preferences);
      const group = groups.get(key);
      if (group) {
        group.emails.push(sub.email);
      } else {
        groups.set(key, { prefs: sub.preferences, emails: [sub.email] });
      }
    }

    // 5. Build and send per-group emails
    let totalSent = 0;
    let defaultStats = null;

    for (const [, group] of groups) {
      const items = group.prefs
        ? filterItemsByPrefs(allItems, group.prefs)
        : allItems;

      const sources = new Set(items.map((i) => i.source));
      const stats = {
        total: items.length,
        critical: items.filter((i) => i.severity === "critical").length,
        high: items.filter((i) => i.severity === "high").length,
        sources: sources.size,
      };

      if (!defaultStats) defaultStats = stats;

      const { subject, html } = buildDailyBriefingEmail({
        items,
        aiSummary,
        anomalies,
        stats,
        date,
      });

      await sendMail({ to: group.emails, subject, html });
      totalSent += group.emails.length;
    }

    return NextResponse.json({
      success: true,
      sent: totalSent,
      groups: groups.size,
      stats: defaultStats,
      anomalies: anomalies.length,
    });
  } catch (e) {
    console.error("[Cron] Briefing send failed:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
