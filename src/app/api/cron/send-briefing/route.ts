import { NextResponse } from "next/server";
import { fetchPersistedEvents } from "@/lib/db/events";
import { detectAnomalies } from "@/lib/utils/anomaly-detection";
import { buildDailyBriefingEmail } from "@/lib/mail/templates";
import type { BriefingData, Earthquake, WeatherAlert } from "@/lib/mail/templates";
import {
  sendMail,
  getActiveSubscribersWithPrefs,
  type DigestPreferences,
} from "@/lib/mail/sender";
import { seedRead } from "@/lib/seed/seed-utils";
import { redis } from "@/lib/cache/redis";
import type { IntelItem } from "@/types/intel";
import type { MarketQuote } from "@/types/market";
import type { ConvergenceResponse } from "@/lib/convergence/types";
import { SEED_KEYS, CONVERGENCE_KEYS } from "@/lib/cache/keys";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * Fetch all enrichment data from Redis seed cache.
 * Each source is fetched independently — failures don't block others.
 */
async function fetchEnrichmentData() {
  const [marketQuotes, cryptoQuotes, fearGreed, earthquakes, weather, convergenceData, radiationReadings] = await Promise.allSettled([
    seedRead<MarketQuote[]>(SEED_KEYS.market.quotes),
    seedRead<MarketQuote[]>(SEED_KEYS.market.crypto),
    seedRead<{ value: number; classification: string }>(SEED_KEYS.market.fearGreed),
    seedRead<Earthquake[]>(SEED_KEYS.natural.earthquakes),
    seedRead<WeatherAlert[]>(SEED_KEYS.natural.weather),
    redis.get<ConvergenceResponse>(CONVERGENCE_KEYS.latest),
    seedRead<Array<{ value?: number; unit?: string }>>(SEED_KEYS.radiation.readings),
  ]);

  // Count elevated radiation readings (> 0.5 µSv/h is notable)
  let radiationAlerts = 0;
  if (radiationReadings.status === "fulfilled" && radiationReadings.value) {
    radiationAlerts = radiationReadings.value.filter(
      (r) => typeof r.value === "number" && r.value > 0.5
    ).length;
  }

  return {
    marketQuotes: marketQuotes.status === "fulfilled" ? marketQuotes.value ?? undefined : undefined,
    cryptoQuotes: cryptoQuotes.status === "fulfilled" ? cryptoQuotes.value ?? undefined : undefined,
    fearGreed: fearGreed.status === "fulfilled" ? fearGreed.value ?? undefined : undefined,
    earthquakes: earthquakes.status === "fulfilled" ? earthquakes.value ?? undefined : undefined,
    weather: weather.status === "fulfilled" ? weather.value ?? undefined : undefined,
    convergences: convergenceData.status === "fulfilled" ? convergenceData.value?.convergences ?? undefined : undefined,
    radiationAlerts: radiationAlerts > 0 ? radiationAlerts : undefined,
  };
}

/**
 * GET /api/cron/send-briefing
 * Sends daily intelligence briefing to all active subscribers.
 * Enriched with market data, natural hazards, convergence analysis.
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

    // 2. Fetch intel events + enrichment data in parallel
    const [allItems, enrichment] = await Promise.all([
      fetchPersistedEvents({ limit: 2000, hoursBack: 24 }),
      fetchEnrichmentData(),
    ]);

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
    } catch (err) {
      console.error("[cron/send-briefing]", err);
      // AI summary optional — continue without it
    }

    const date = new Date().toISOString().split("T")[0];

    // 4. Group subscribers by preference signature for batching
    const SEVERITY_ORDER = ["info", "low", "medium", "high", "critical"];

    function filterItemsByPrefs(items: IntelItem[], prefs: DigestPreferences): IntelItem[] {
      let filtered = items;

      if (prefs.categories.length > 0) {
        filtered = filtered.filter((item) => {
          const cat = item.category?.toLowerCase() || "";
          return prefs.categories.some((c) => cat.includes(c));
        });
      }

      if (prefs.minSeverity !== "all") {
        const minIdx = SEVERITY_ORDER.indexOf(prefs.minSeverity);
        if (minIdx > 0) {
          filtered = filtered.filter((item) => {
            const itemIdx = SEVERITY_ORDER.indexOf(item.severity || "info");
            return itemIdx >= minIdx;
          });
        }
      }

      return filtered.slice(0, prefs.maxItems);
    }

    function prefsKey(prefs?: DigestPreferences): string {
      if (!prefs) return "default";
      return `${prefs.categories.sort().join(",")}_${prefs.minSeverity}_${prefs.maxItems}`;
    }

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

      const briefingData: BriefingData = {
        items,
        aiSummary,
        anomalies,
        stats,
        date,
        ...enrichment,
      };

      const { subject, html } = buildDailyBriefingEmail(briefingData);

      await sendMail({ to: group.emails, subject, html });
      totalSent += group.emails.length;
    }

    return NextResponse.json({
      success: true,
      sent: totalSent,
      groups: groups.size,
      stats: defaultStats,
      anomalies: anomalies.length,
      enrichment: {
        hasMarket: !!enrichment.marketQuotes?.length,
        hasCrypto: !!enrichment.cryptoQuotes?.length,
        hasEarthquakes: !!enrichment.earthquakes?.length,
        hasWeather: !!enrichment.weather?.length,
        hasConvergence: !!enrichment.convergences?.length,
        radiationAlerts: enrichment.radiationAlerts || 0,
      },
    });
  } catch (e) {
    console.error("[Cron] Briefing send failed:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
