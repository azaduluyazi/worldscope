/**
 * Per-country briefing generator.
 *
 * For a given ISO-3166 alpha-2 country code, pulls the last 24h of events
 * tagged to that country, feeds them to the brief model, and returns a
 * short markdown summary + severity rollup. The cron handler
 * (/api/cron/generate-country-briefings) calls this for every country
 * that has any fresh events and upserts into public.country_briefings.
 *
 * Design note — the prompt is deliberately terse and explicit about
 * sourcing because the downstream email is read by subscribers paying
 * $9/mo for ground-truth intel. A halluciated event in their inbox is
 * a trust disaster. The prompt forces the model to stay inside the
 * supplied event list.
 */

import { generateText } from "ai";
import { briefModel } from "@/lib/ai/providers";
import { createServerClient } from "@/lib/db/supabase";

const SEVERITY_RANK: Record<string, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

export interface CountryBriefingResult {
  country_code: string;
  date: string; // YYYY-MM-DD
  locale: string;
  content: string;
  event_count: number;
  top_severity: string | null;
  generation_ms: number;
}

interface EventRow {
  title: string;
  summary: string | null;
  severity: string;
  category: string;
  source: string;
  url: string | null;
  published_at: string;
}

function systemPrompt(countryName: string): string {
  return `You are WorldScope's country desk analyst. You produce a tight daily intelligence brief for ${countryName} from the event list the user sends.

Output rules:
- Start with one sentence framing the day ("Mostly quiet.", "Energy prices dominated.", etc.).
- Then 4–7 bullets, each a single sentence:  "[severity] headline — source"
- Sort bullets by severity descending, then by recency.
- No speculation. If the feed has nothing on a topic, don't invent it.
- If the list is empty or all low severity, say "No significant events in the last 24 hours." and stop.
- Absolute dates when you mention dates (YYYY-MM-DD). No "yesterday"/"recently".
- Plain markdown, no HTML, no emojis.
- Do not add meta commentary ("Here is your brief…"). Open directly with the framing sentence.`;
}

function topSeverity(events: { severity: string }[]): string | null {
  if (events.length === 0) return null;
  let top: { severity: string; rank: number } = { severity: "info", rank: 0 };
  for (const e of events) {
    const rank = SEVERITY_RANK[e.severity] ?? 0;
    if (rank > top.rank) top = { severity: e.severity, rank };
  }
  return top.severity;
}

function eventsToPrompt(events: EventRow[]): string {
  return events
    .map(
      (e, i) =>
        `${i + 1}. [${e.severity}/${e.category}] ${e.title}${
          e.summary ? ` — ${e.summary.slice(0, 180)}` : ""
        } (${e.source}${e.url ? ` ${e.url}` : ""})`,
    )
    .join("\n");
}

/**
 * Generate a briefing for one country. Returns null when the country has
 * zero events in the window — caller skips the upsert in that case so we
 * don't fill the table with empty rows.
 */
export async function generateCountryBriefing(
  countryCode: string,
  opts: { date?: string; hoursBack?: number; locale?: "en" | "tr" } = {},
): Promise<CountryBriefingResult | null> {
  const { date = new Date().toISOString().slice(0, 10), hoursBack = 24, locale = "en" } =
    opts;
  const started = Date.now();

  const db = createServerClient();
  const since = new Date(Date.now() - hoursBack * 3600_000).toISOString();

  const { data, error } = await db
    .from("events")
    .select("title, summary, severity, category, source, url, published_at")
    .eq("country_code", countryCode.toUpperCase())
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(40);

  if (error) throw new Error(`events query failed: ${error.message}`);
  const events: EventRow[] = data ?? [];

  if (events.length === 0) return null;

  // Focus the LLM on the most meaningful subset — avoids 40-item token bloat.
  const ranked = [...events].sort((a, b) => {
    const sa = SEVERITY_RANK[a.severity] ?? 0;
    const sb = SEVERITY_RANK[b.severity] ?? 0;
    if (sa !== sb) return sb - sa;
    return +new Date(b.published_at) - +new Date(a.published_at);
  });
  const focus = ranked.slice(0, 20);

  const { text } = await generateText({
    model: briefModel,
    system: systemPrompt(countryCode.toUpperCase()),
    messages: [{ role: "user", content: eventsToPrompt(focus) }],
  });

  return {
    country_code: countryCode.toUpperCase(),
    date,
    locale,
    content: text.trim(),
    event_count: events.length,
    top_severity: topSeverity(events),
    generation_ms: Date.now() - started,
  };
}

/**
 * Find every country that has at least one event in the last `hoursBack`
 * hours. We only generate briefings for these — skipping the 100+ quiet
 * ISO codes saves ~75% of LLM spend on a typical day.
 */
export async function activeCountries(hoursBack: number = 24): Promise<string[]> {
  const db = createServerClient();
  const since = new Date(Date.now() - hoursBack * 3600_000).toISOString();
  const { data, error } = await db
    .from("events")
    .select("country_code")
    .gte("published_at", since)
    .not("country_code", "is", null);
  if (error) throw new Error(`activeCountries failed: ${error.message}`);
  const set = new Set<string>();
  for (const row of data ?? []) {
    if (row.country_code) set.add(String(row.country_code).toUpperCase());
  }
  return [...set].sort();
}
