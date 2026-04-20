/**
 * Alert rule evaluator.
 *
 * Given a single IntelItem, return the list of active rules that match
 * it. Each rule's filters (keywords / categories / countries / min score
 * / severities) combine conjunctively — a rule is a match only if ALL
 * of its set filters pass. Within a filter, the values are disjunctive
 * (any match wins).
 *
 * Rules with all filters empty are considered "match anything" and
 * included only if explicitly flagged via the `match_all` intent —
 * right now, we refuse to match those to avoid accidental spam.
 */

import type { IntelItem } from "@/types/intel";

export interface AlertRule {
  id: string;
  user_id: string | null;
  name: string;
  active: boolean;
  keywords_plain: string[] | null;
  categories: string[] | null;
  countries: string[] | null;
  min_score: number | null;
  severities: string[] | null;
  quiet_hours: QuietHours | null;
  channels: unknown;
  cooldown_minutes: number | null;
  last_fired_at: string | null;
}

export interface QuietHours {
  /** IANA tz, e.g. "Europe/Istanbul". Default UTC if unset. */
  tz?: string;
  /** Array of HH:MM-HH:MM windows during which the rule is suppressed. */
  ranges: { start: string; end: string }[];
}

export interface MatchResult {
  matched: boolean;
  reasons: {
    keywords?: string[];
    categories?: string[];
    countries?: string[];
    severities?: string[];
    score?: number;
  };
}

function itemText(item: IntelItem): string {
  return [item.title, item.source, item.category, item.countryCode]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function matchRule(rule: AlertRule, item: IntelItem): MatchResult {
  if (!rule.active) return { matched: false, reasons: {} };
  const reasons: MatchResult["reasons"] = {};
  let matched = true;
  let anyFilterSet = false;

  // Keywords — substring OR match
  const kws = (rule.keywords_plain ?? []).map((k) => k.toLowerCase()).filter(Boolean);
  if (kws.length > 0) {
    anyFilterSet = true;
    const body = itemText(item);
    const hits = kws.filter((k) => body.includes(k));
    if (hits.length === 0) matched = false;
    else reasons.keywords = hits;
  }

  // Categories
  const cats = (rule.categories ?? []).map((c) => c.toLowerCase()).filter(Boolean);
  if (cats.length > 0) {
    anyFilterSet = true;
    const cat = (item.category ?? "").toLowerCase();
    if (!cats.includes(cat)) matched = false;
    else reasons.categories = [cat];
  }

  // Countries
  const countries = (rule.countries ?? []).map((c) => c.toUpperCase()).filter(Boolean);
  if (countries.length > 0) {
    anyFilterSet = true;
    const c = (item.countryCode ?? "").toUpperCase();
    if (!countries.includes(c)) matched = false;
    else reasons.countries = [c];
  }

  // Score floor
  const minScore = rule.min_score ?? 0;
  if (minScore > 0) {
    anyFilterSet = true;
    const score = (item as IntelItem & { score?: number }).score ?? 0;
    if (score < minScore) matched = false;
    else reasons.score = score;
  }

  // Severities
  const sevs = (rule.severities ?? []).map((s) => s.toLowerCase()).filter(Boolean);
  if (sevs.length > 0) {
    anyFilterSet = true;
    if (!sevs.includes(item.severity)) matched = false;
    else reasons.severities = [item.severity];
  }

  if (!anyFilterSet) return { matched: false, reasons: {} };
  return { matched, reasons };
}

/** Current time, as { h, m }, in the rule's timezone. */
function nowInTz(tz: string): { h: number; m: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return { h, m };
}

function parseHHMM(s: string): { h: number; m: number } {
  const [h, m] = s.split(":").map(Number);
  return { h: h ?? 0, m: m ?? 0 };
}

/** Returns true if the current instant in `tz` is inside any quiet range. */
export function isQuietNow(qh: QuietHours | null | undefined): boolean {
  if (!qh?.ranges?.length) return false;
  const tz = qh.tz || "UTC";
  let now: { h: number; m: number };
  try {
    now = nowInTz(tz);
  } catch {
    return false;
  }
  const minutes = now.h * 60 + now.m;
  for (const r of qh.ranges) {
    const s = parseHHMM(r.start);
    const e = parseHHMM(r.end);
    const sMin = s.h * 60 + s.m;
    const eMin = e.h * 60 + e.m;
    if (sMin === eMin) continue;
    if (sMin < eMin) {
      if (minutes >= sMin && minutes < eMin) return true;
    } else {
      // wraps midnight — e.g. 22:00-07:00
      if (minutes >= sMin || minutes < eMin) return true;
    }
  }
  return false;
}

export function isOnCooldown(rule: AlertRule): boolean {
  const cooldownMin = rule.cooldown_minutes ?? 0;
  if (cooldownMin <= 0 || !rule.last_fired_at) return false;
  const last = Date.parse(rule.last_fired_at);
  if (Number.isNaN(last)) return false;
  const deltaMin = (Date.now() - last) / 60_000;
  return deltaMin < cooldownMin;
}

export type SuppressedReason = "quiet_hours" | "cooldown" | null;

export function suppressionReason(rule: AlertRule): SuppressedReason {
  if (isQuietNow(rule.quiet_hours)) return "quiet_hours";
  if (isOnCooldown(rule)) return "cooldown";
  return null;
}
