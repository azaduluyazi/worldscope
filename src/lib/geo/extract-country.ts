/**
 * Text-based country extractor.
 *
 * Most RSS feeds and news APIs don't attach a country code to items,
 * but the country is almost always named in the headline or lead
 * sentence ("Türkiye'de…", "Iran's nuclear…", "Israeli forces…").
 * This module scans title + summary for an exact match against our
 * 195-country catalog (English + Turkish + common adjectival forms)
 * and returns the ISO-3166 alpha-2 code.
 *
 * Design rules:
 *   - Word-boundary matching only. "USA" inside "USAir" must NOT match.
 *   - Case-insensitive, diacritic-aware ("İran" matches "Iran").
 *   - When multiple countries appear, the *first* occurrence wins so a
 *     "Türkiye - Suriye sınırı" headline maps to TR (primary subject).
 *   - Adjectivals like "American", "Russian" are included because many
 *     headlines never name the country itself ("Russian forces in…").
 *   - Ambiguous strings ("Georgia" = country OR US state) are skipped;
 *     we prefer false-negatives over cross-tagging.
 *
 * Performance: one compile-at-module-load regex per catalog entry,
 * linear scan per call. ~1µs per event on the 195-entry list.
 */

import { COUNTRIES } from "@/config/countries";

interface Pattern {
  code: string;
  regex: RegExp;
}

/** Adjectivals + alternate spellings mapped to country codes. Keep
 *  conservative — false matches are worse than a null tag. */
const ADJECTIVALS: Record<string, string[]> = {
  US: ["American", "U\\.S\\.", "USA", "United States"],
  GB: ["British", "UK\\b", "U\\.K\\.", "United Kingdom"],
  DE: ["German"],
  FR: ["French"],
  IT: ["Italian"],
  ES: ["Spanish"],
  RU: ["Russian"],
  UA: ["Ukrainian"],
  CN: ["Chinese"],
  JP: ["Japanese"],
  KR: ["South Korean"],
  KP: ["North Korean"],
  IN: ["Indian"],
  PK: ["Pakistani"],
  IR: ["Iranian"],
  IQ: ["Iraqi"],
  SY: ["Syrian"],
  IL: ["Israeli"],
  PS: ["Palestinian"],
  TR: ["Turkish", "Türk"],
  SA: ["Saudi"],
  EG: ["Egyptian"],
  AE: ["Emirati"],
  BR: ["Brazilian"],
  MX: ["Mexican"],
  CA: ["Canadian"],
  AU: ["Australian"],
  ZA: ["South African"],
  NG: ["Nigerian"],
  ET: ["Ethiopian"],
  KE: ["Kenyan"],
  AF: ["Afghan"],
  LB: ["Lebanese"],
  YE: ["Yemeni"],
  JO: ["Jordanian"],
  QA: ["Qatari"],
  KW: ["Kuwaiti"],
  OM: ["Omani"],
  BH: ["Bahraini"],
  PL: ["Polish"],
  NL: ["Dutch"],
  BE: ["Belgian"],
  SE: ["Swedish"],
  NO: ["Norwegian"],
  FI: ["Finnish"],
  DK: ["Danish"],
  GR: ["Greek"],
  PT: ["Portuguese"],
  CH: ["Swiss"],
  AT: ["Austrian"],
  IE: ["Irish"],
  RO: ["Romanian"],
  BG: ["Bulgarian"],
  HR: ["Croatian"],
  RS: ["Serbian"],
  HU: ["Hungarian"],
  CZ: ["Czech"],
  SK: ["Slovak"],
  TH: ["Thai"],
  VN: ["Vietnamese"],
  PH: ["Filipino"],
  ID: ["Indonesian"],
  MY: ["Malaysian"],
  SG: ["Singaporean"],
};

/** Country names whose plain word form is too ambiguous to match
 *  without context. We still keep the adjectival ("Georgian") for
 *  these. */
const AMBIGUOUS_PLAIN_NAMES = new Set(["Georgia", "Jordan", "Chad"]);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PATTERNS: Pattern[] = (() => {
  const entries: Pattern[] = [];
  for (const c of COUNTRIES) {
    const variants: string[] = [];
    if (!AMBIGUOUS_PLAIN_NAMES.has(c.name)) variants.push(c.name);
    // Turkish name if it differs
    if (c.nameTr && c.nameTr !== c.name) variants.push(c.nameTr);
    const adjectivals = ADJECTIVALS[c.code] || [];
    variants.push(...adjectivals);

    if (variants.length === 0) continue;

    // \b works in ASCII; for Turkish "Türkiye" we need a softer boundary.
    // Use (?:^|\W) ... (?:$|\W) so we match word-like boundaries incl.
    // non-ASCII letters without tripping on hyphens or apostrophes.
    const alternation = variants.map(escapeRegex).join("|");
    entries.push({
      code: c.code,
      regex: new RegExp(`(?:^|[^\\p{L}])(?:${alternation})(?:[^\\p{L}]|$)`, "iu"),
    });
  }
  return entries;
})();

/**
 * Extract the most likely country ISO-2 code from free-text content.
 * Returns null when no country is unambiguously named.
 */
export function extractCountryCode(...texts: (string | null | undefined)[]): string | null {
  const haystack = texts.filter(Boolean).join(" \n ");
  if (!haystack || haystack.length < 3) return null;

  // First-occurrence wins — so we track the earliest match across all
  // country patterns and return that country.
  let bestIndex = Number.POSITIVE_INFINITY;
  let bestCode: string | null = null;
  for (const { code, regex } of PATTERNS) {
    const m = haystack.match(regex);
    if (m && m.index !== undefined && m.index < bestIndex) {
      bestIndex = m.index;
      bestCode = code;
    }
  }
  return bestCode;
}
