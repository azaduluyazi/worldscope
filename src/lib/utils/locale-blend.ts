/**
 * Locale-aware feed blending for /api/intel.
 *
 * Problem (Session 17 user feedback): When a Turkish user selects TR, the feed
 * still returns Spanish/English/etc. sources because IntelItem has no `language`
 * field — only a `source: string`. We can't filter by item.language directly.
 *
 * Solution: Build a source-name → language map at module load time from
 * `src/config/feeds.ts` (which has `language: "tr"` tags on each feed config).
 * Then do a "smart blend" sort: locale-matching sources rank first, then
 * high-severity global sources, then everything else. This preserves discovery
 * (global crisis headlines still visible) while honoring the user's language
 * preference (native-language sources dominate the feed).
 *
 * Why smart blend instead of hard filter:
 * - Hard filter would hide global crises (Iran crisis, US market crash) from TR
 *   users even though those events matter globally.
 * - Smart blend keeps the top-of-feed in the user's language, but critical/high
 *   events from global sources still surface after the locale-match block.
 *
 * Algorithm (lower score = earlier in list):
 *   - score 0 : source language matches user locale
 *   - score 1 : source language unknown + severity is critical or high
 *   - score 2 : source language unknown + other severity
 *   - score 3 : source language is a different locale entirely
 *
 * Ties are broken by existing sort (severity + recency).
 */

import { SEED_FEEDS } from "@/config/feeds";
import type { IntelItem } from "@/types/intel";

// ─── Source → language map ────────────────────────────────────────────────
// Built once at module load from SEED_FEEDS. Keys are normalized source names
// (lowercase, trimmed) for robust matching.

const SOURCE_LANG_MAP: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const feed of SEED_FEEDS) {
    if (feed.language) {
      map.set(feed.name.toLowerCase().trim(), feed.language);
    }
  }
  return map;
})();

/** Known Turkish source names that predate feeds.ts tagging (hand-maintained). */
const TR_EXTRA_SOURCES = new Set<string>([
  "anadolu agency",
  "trt world",
  "hurriyet",
  "milliyet",
  "sabah",
  "posta",
  "star",
  "zaman",
]);

/**
 * Best-effort lookup of a source's primary language.
 * Returns undefined if unknown (caller treats as "neutral/global").
 */
export function getSourceLanguage(sourceName: string | undefined): string | undefined {
  if (!sourceName) return undefined;
  const key = sourceName.toLowerCase().trim();
  const tagged = SOURCE_LANG_MAP.get(key);
  if (tagged) return tagged;
  if (TR_EXTRA_SOURCES.has(key)) return "tr";
  return undefined;
}

/**
 * Smart blend sort: re-rank items so locale-matching sources bubble up,
 * while high-severity global sources still appear in the blend.
 *
 * This is a STABLE PARTITION — items with the same score keep their relative
 * order from the upstream sort (severity + recency).
 *
 * @param items - Already sorted IntelItem array (by recency + severity)
 * @param locale - User's selected locale (e.g. "tr", "en", "ar")
 * @returns New array, same length, reordered by locale preference
 */
export function smartBlendByLocale(
  items: IntelItem[],
  locale: string
): IntelItem[] {
  if (!locale || locale === "en") {
    // English is the global default — no reordering needed, global sources
    // already dominate the feed catalog.
    return items;
  }

  const scored = items.map((item, idx) => {
    const lang = getSourceLanguage(item.source);
    let score: number;

    if (lang === locale) {
      score = 0; // native language match
    } else if (!lang) {
      // Unknown source language — assume global/English.
      // High-severity global news still deserves top-tier placement.
      score = item.severity === "critical" || item.severity === "high" ? 1 : 2;
    } else {
      // Different locale entirely (e.g. Spanish source for TR user) — demote.
      score = 3;
    }

    return { item, score, idx };
  });

  // Stable sort: primary by score, tiebreaker by original index (preserves
  // upstream severity/recency ordering within each score bucket).
  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return a.idx - b.idx;
  });

  return scored.map((s) => s.item);
}

/**
 * Diagnostic counts of how many items fell into each blend bucket.
 * Useful for admin panel / debug endpoint to verify filter is working.
 */
export function getBlendStats(
  items: IntelItem[],
  locale: string
): { localeMatch: number; globalHigh: number; globalOther: number; otherLocale: number } {
  let localeMatch = 0;
  let globalHigh = 0;
  let globalOther = 0;
  let otherLocale = 0;

  for (const item of items) {
    const lang = getSourceLanguage(item.source);
    if (lang === locale) {
      localeMatch++;
    } else if (!lang) {
      if (item.severity === "critical" || item.severity === "high") {
        globalHigh++;
      } else {
        globalOther++;
      }
    } else {
      otherLocale++;
    }
  }

  return { localeMatch, globalHigh, globalOther, otherLocale };
}
