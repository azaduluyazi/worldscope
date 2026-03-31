/**
 * Channel index — all channels merged, no tier gating.
 */

import { YOUTUBE_CHANNELS } from "./youtube-channels";
import { IPTV_CHANNELS } from "./iptv-channels";
import { VARIANT_CHANNEL_PREFS } from "./variant-mapping";

// Re-export types and constants
export type { LiveChannel, LiveWebcam, ChannelCategory } from "./types";
export { CHANNEL_CATEGORIES } from "./types";
export { VARIANT_CHANNEL_PREFS } from "./variant-mapping";
export type { VariantChannelPrefs } from "./variant-mapping";

// Re-export webcams
export { LIVE_WEBCAMS, WEBCAM_REGIONS } from "./webcams";

// ─── All channels merged ──────────────────────────────────────
export { YOUTUBE_CHANNELS };
export { IPTV_CHANNELS };

/** All channels — YouTube + IPTV merged */
export const ALL_CHANNELS = [...YOUTUBE_CHANNELS, ...IPTV_CHANNELS];

// ─── Helpers ──────────────────────────────────────────────────

import type { LiveChannel, ChannelCategory } from "./types";

/** Get channels filtered by locale */
export function getChannelsByLocale(
  locale: string,
  channels?: LiveChannel[]
): LiveChannel[] {
  const source = channels ?? ALL_CHANNELS;
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
  const source = channels ?? ALL_CHANNELS;
  return source.filter(
    (ch) => ch.country?.toUpperCase() === countryCode.toUpperCase()
  );
}

/** Get all unique countries that have channels */
export function getAvailableCountries(channels?: LiveChannel[]) {
  const source = channels ?? ALL_CHANNELS;
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
    const aHasAffinity = a.variantAffinity?.includes(variantId) ? 1 : 0;
    const bHasAffinity = b.variantAffinity?.includes(variantId) ? 1 : 0;
    if (aHasAffinity !== bHasAffinity) return bHasAffinity - aHasAffinity;

    const aMatchesCat = prefs.primaryCategories.includes(a.category || "") ? 1 : 0;
    const bMatchesCat = prefs.primaryCategories.includes(b.category || "") ? 1 : 0;
    if (aMatchesCat !== bMatchesCat) return bMatchesCat - aMatchesCat;

    if (prefs.boostCountries) {
      const aBoosted = prefs.boostCountries.includes(a.country || "") ? 1 : 0;
      const bBoosted = prefs.boostCountries.includes(b.country || "") ? 1 : 0;
      if (aBoosted !== bBoosted) return bBoosted - aBoosted;
    }

    return 0;
  });
}

/** Convert ISO country code to flag emoji */
export function getCountryFlag(code: string): string {
  return [...code.toUpperCase()].map((c) =>
    String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0))
  ).join("");
}

export const COUNTRY_NAMES: Record<string, string> = {
  US: "USA", GB: "UK", TR: "Turkey", QA: "Qatar", AE: "UAE", SA: "Saudi Arabia",
  DE: "Germany", FR: "France", ES: "Spain", CL: "Chile", JP: "Japan",
  KR: "Korea", RU: "Russia", CN: "China", IN: "India",
  IT: "Italy", BR: "Brazil", MX: "Mexico", AR: "Argentina", IL: "Israel",
  EG: "Egypt", PK: "Pakistan", NG: "Nigeria", ZA: "South Africa", AU: "Australia",
  CA: "Canada", PL: "Poland", UA: "Ukraine", IR: "Iran", IQ: "Iraq",
  NL: "Netherlands", SE: "Sweden", NO: "Norway", GR: "Greece", RO: "Romania",
  PT: "Portugal", PH: "Philippines", MY: "Malaysia", ID: "Indonesia", TH: "Thailand",
  VN: "Vietnam", CO: "Colombia", PE: "Peru", GH: "Ghana",
  AF: "Afghanistan", AL: "Albania", DZ: "Algeria", AO: "Angola", AT: "Austria",
  AZ: "Azerbaijan", BH: "Bahrain", BD: "Bangladesh", BY: "Belarus", BE: "Belgium",
  BO: "Bolivia", BA: "Bosnia", BG: "Bulgaria", KH: "Cambodia", CM: "Cameroon",
  HR: "Croatia", CU: "Cuba", CY: "Cyprus", CZ: "Czech Republic", DK: "Denmark",
  DO: "Dominican Republic", EC: "Ecuador", ET: "Ethiopia", FI: "Finland",
  GE: "Georgia", GT: "Guatemala", HN: "Honduras", HK: "Hong Kong", HU: "Hungary",
  IS: "Iceland", IE: "Ireland", JO: "Jordan", KZ: "Kazakhstan", KE: "Kenya",
  KW: "Kuwait", LB: "Lebanon", LY: "Libya", LT: "Lithuania", LU: "Luxembourg",
  MK: "N. Macedonia", MG: "Madagascar", MW: "Malawi", ML: "Mali", MT: "Malta",
  MA: "Morocco", MZ: "Mozambique", MM: "Myanmar", NP: "Nepal", NZ: "New Zealand",
  NI: "Nicaragua", OM: "Oman", PA: "Panama", PY: "Paraguay", QC: "Quebec",
  RS: "Serbia", SG: "Singapore", SK: "Slovakia", SI: "Slovenia", SO: "Somalia",
  LK: "Sri Lanka", SD: "Sudan", CH: "Switzerland", SY: "Syria", TW: "Taiwan",
  TZ: "Tanzania", TN: "Tunisia", TM: "Turkmenistan", UG: "Uganda", UY: "Uruguay",
  UZ: "Uzbekistan", VE: "Venezuela", YE: "Yemen", ZM: "Zambia", ZW: "Zimbabwe",
};
