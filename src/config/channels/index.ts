/**
 * Channel index — tier-aware helpers + backward-compatible exports.
 *
 * Free tier: YouTube channels only (static import, always in bundle)
 * Premium tier: YouTube + IPTV channels (IPTV loaded via dynamic import)
 */

import { YOUTUBE_CHANNELS } from "./youtube-channels";
import { VARIANT_CHANNEL_PREFS } from "./variant-mapping";

// Re-export types and constants
export type { LiveChannel, LiveWebcam, ChannelCategory } from "./types";
export { CHANNEL_CATEGORIES } from "./types";
export { VARIANT_CHANNEL_PREFS } from "./variant-mapping";
export type { VariantChannelPrefs } from "./variant-mapping";

// Re-export webcams from original file (free tier, YouTube-based)
export { LIVE_WEBCAMS, WEBCAM_REGIONS } from "./webcams";

// ─── Free tier channels (always available) ─────────────────────
export { YOUTUBE_CHANNELS };

// ─── Premium tier channels (lazy-loaded) ───────────────────────

/** Dynamically load IPTV channels — only call when user is premium */
export async function loadIPTVChannels() {
  const { IPTV_CHANNELS } = await import("./iptv-channels");
  return IPTV_CHANNELS;
}

// ─── Tier-aware helpers ────────────────────────────────────────

import type { LiveChannel, ChannelCategory } from "./types";

/** Get channels filtered by locale — tier-aware */
export function getChannelsByLocale(
  locale: string,
  channels?: LiveChannel[]
): LiveChannel[] {
  const source = channels ?? YOUTUBE_CHANNELS;
  const intl = source.filter((ch) => ch.lang === "en");
  if (locale === "en") return intl;
  const localized = source.filter((ch) => ch.lang === locale);
  return [...localized, ...intl];
}

/** Get channels filtered by country code */
export function getChannelsByCountry(
  countryCode: string,
  channels?: LiveChannel[]
): LiveChannel[] {
  const source = channels ?? YOUTUBE_CHANNELS;
  return source.filter(
    (ch) => ch.country?.toUpperCase() === countryCode.toUpperCase()
  );
}

/** Get all unique countries that have channels */
export function getAvailableCountries(channels?: LiveChannel[]) {
  const source = channels ?? YOUTUBE_CHANNELS;
  const countryMap = new Map<string, number>();
  source.forEach((ch) => {
    if (ch.country) {
      countryMap.set(ch.country, (countryMap.get(ch.country) || 0) + 1);
    }
  });

  return [...countryMap.entries()]
    .map(([code, count]) => ({
      code,
      name: COUNTRY_NAMES[code] || code,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Filter channels by category */
export function getChannelsByCategory(
  channels: LiveChannel[],
  category: ChannelCategory
): LiveChannel[] {
  if (category === "all") return channels;
  return channels.filter((ch) => ch.category === category);
}

/** Sort channels by variant preference — variant-preferred channels first */
export function sortChannelsByVariant(
  channels: LiveChannel[],
  variantId: string
): LiveChannel[] {
  const prefs = VARIANT_CHANNEL_PREFS[variantId];
  if (!prefs) return channels;

  return [...channels].sort((a, b) => {
    // Channels with matching variantAffinity come first
    const aHasAffinity = a.variantAffinity?.includes(variantId) ? 1 : 0;
    const bHasAffinity = b.variantAffinity?.includes(variantId) ? 1 : 0;
    if (aHasAffinity !== bHasAffinity) return bHasAffinity - aHasAffinity;

    // Then channels matching primary categories
    const aMatchesCat = prefs.primaryCategories.includes(a.category || "") ? 1 : 0;
    const bMatchesCat = prefs.primaryCategories.includes(b.category || "") ? 1 : 0;
    if (aMatchesCat !== bMatchesCat) return bMatchesCat - aMatchesCat;

    // Then boost countries
    if (prefs.boostCountries) {
      const aBoosted = prefs.boostCountries.includes(a.country || "") ? 1 : 0;
      const bBoosted = prefs.boostCountries.includes(b.country || "") ? 1 : 0;
      if (aBoosted !== bBoosted) return bBoosted - aBoosted;
    }

    return 0;
  });
}

const COUNTRY_NAMES: Record<string, string> = {
  US: "USA", GB: "UK", TR: "Turkey", QA: "Qatar", AE: "UAE", SA: "Saudi Arabia",
  DE: "Germany", FR: "France", ES: "Spain", CL: "Chile", JP: "Japan",
  KR: "Korea", RU: "Russia", CN: "China", IN: "India",
  IT: "Italy", BR: "Brazil", MX: "Mexico", AR: "Argentina", IL: "Israel",
  EG: "Egypt", PK: "Pakistan", NG: "Nigeria", ZA: "South Africa", AU: "Australia",
  CA: "Canada", PL: "Poland", UA: "Ukraine", IR: "Iran", IQ: "Iraq",
  NL: "Netherlands", SE: "Sweden", NO: "Norway", GR: "Greece", RO: "Romania",
  PT: "Portugal", PH: "Philippines", MY: "Malaysia", ID: "Indonesia", TH: "Thailand",
  VN: "Vietnam", CO: "Colombia", PE: "Peru", GH: "Ghana",
};
