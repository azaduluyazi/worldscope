/**
 * Alert engine — evaluate all active rules against one or more intel
 * items, dispatch matches through the digest channel layer, and
 * write fire / suppression records.
 *
 * The evaluator itself is pure; this module does the DB + side-effects.
 */

import { createServerClient } from "@/lib/db/supabase";
import { dispatchDigest, type DigestChannelConfig } from "@/lib/digest/dispatch";
import type { DigestItem, DigestMeta } from "@/lib/digest/types";
import type { IntelItem } from "@/types/intel";
import {
  matchRule,
  suppressionReason,
  type AlertRule,
  type SuppressedReason,
} from "./evaluator";

function intelToDigest(item: IntelItem): DigestItem {
  return {
    title: item.title,
    severity: item.severity,
    publishedAt: item.publishedAt,
    source: item.source,
    url: item.url,
    country: item.countryCode ?? undefined,
    category: item.category,
    score: (item as IntelItem & { score?: number }).score,
  };
}

export interface EngineResult {
  evaluated: number;
  fired: number;
  suppressed: { ruleId: string; reason: SuppressedReason }[];
  errors: string[];
}

/** Fetch the active rule set once per engine run. */
export async function loadActiveRules(): Promise<AlertRule[]> {
  const db = createServerClient();
  const { data, error } = await db
    .from("alert_rules")
    .select(
      "id, user_id, name, active, keywords_plain, categories, countries, min_score, severities, quiet_hours, channels, cooldown_minutes, last_fired_at",
    )
    .eq("active", true);
  if (error) throw new Error(`loadActiveRules: ${error.message}`);
  return (data ?? []) as AlertRule[];
}

/** Run the engine over a batch of items, fanning out any matches. */
export async function runEngine(items: IntelItem[]): Promise<EngineResult> {
  const rules = await loadActiveRules();
  const result: EngineResult = {
    evaluated: items.length,
    fired: 0,
    suppressed: [],
    errors: [],
  };
  if (rules.length === 0 || items.length === 0) return result;

  const db = createServerClient();
  const nowIso = new Date().toISOString();

  for (const rule of rules) {
    const matchedItems: { item: IntelItem; reasons: Record<string, unknown> }[] = [];
    for (const item of items) {
      const { matched, reasons } = matchRule(rule, item);
      if (matched) matchedItems.push({ item, reasons });
    }
    if (matchedItems.length === 0) continue;

    const suppressed = suppressionReason(rule);
    if (suppressed) {
      result.suppressed.push({ ruleId: rule.id, reason: suppressed });
      await db.from("alert_fires").insert({
        rule_id: rule.id,
        event_id: (matchedItems[0].item as IntelItem & { id?: string }).id ?? null,
        item_title: matchedItems[0].item.title,
        matched_on: matchedItems[0].reasons,
        suppressed_reason: suppressed,
      });
      continue;
    }

    const digestItems = matchedItems.map((m) => intelToDigest(m.item));
    const meta: DigestMeta = {
      title: `Alert · ${rule.name}`,
      assessment: `Matched ${digestItems.length} incoming ${digestItems.length === 1 ? "item" : "items"} on rule "${rule.name}".`,
      brandUrl: "https://troiamedia.com",
    };

    const channels = (rule.channels as DigestChannelConfig) ?? {};
    let dispatched;
    try {
      dispatched = await dispatchDigest(digestItems, meta, channels);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`rule ${rule.id}: ${msg}`);
      continue;
    }

    const success = dispatched.every((d) => d.ok);
    if (success) result.fired += 1;
    else {
      result.errors.push(
        `rule ${rule.id}: partial dispatch — ${dispatched.filter((d) => !d.ok).length} of ${dispatched.length} channels failed`,
      );
    }

    await db.from("alert_fires").insert({
      rule_id: rule.id,
      event_id: (matchedItems[0].item as IntelItem & { id?: string }).id ?? null,
      item_title: matchedItems[0].item.title,
      matched_on: matchedItems[0].reasons,
      dispatched_channels: dispatched as unknown as Record<string, unknown>[],
    });

    await db
      .from("alert_rules")
      .update({
        last_fired_at: nowIso,
        fire_count: ((rule as AlertRule & { fire_count?: number }).fire_count ?? 0) + 1,
      })
      .eq("id", rule.id);
  }

  return result;
}
