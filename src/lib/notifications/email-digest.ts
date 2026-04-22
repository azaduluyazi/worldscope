import { Resend } from "resend";
import { createServerClient } from "@/lib/db/supabase";
import type { IntelItem, Severity } from "@/types/intel";
import type { Convergence } from "@/lib/convergence/types";
import { redis } from "@/lib/cache/redis";
import type { ConvergenceResponse } from "@/lib/convergence/types";
import type { CounterFactualSignal } from "@/lib/convergence/counter-factual";
import { CONVERGENCE_KEYS } from "@/lib/cache/keys";

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "#ff4757",
  high: "#ffd000",
  medium: "#00e5ff",
  low: "#00ff88",
  info: "#8a5cf6",
};

interface Subscriber {
  id: number;
  email: string;
  frequency: string;
  categories: string[];
  preferences: Record<string, unknown>;
}

// ── Convergence section helpers ────────────────────────────────────

function confidenceColor(c: number): string {
  if (c >= 0.85) return "#ff4757";
  if (c >= 0.70) return "#ffd000";
  if (c >= 0.50) return "#00e5ff";
  return "#00ff88";
}

function buildConvergenceSection(convergences: Convergence[]): string {
  if (!convergences || convergences.length === 0) return "";

  // Sort high-confidence first, max 5
  const top = [...convergences]
    .filter((c) => c.confidence >= 0.5)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  if (top.length === 0) return "";

  const cards = top.map((c) => {
    const color = confidenceColor(c.confidence);
    const validatedPredictions =
      c.predictions?.filter((p) => p.validated).length ?? 0;
    const headline = c.narrative?.split("\n")[0] ?? c.signals[0]?.title ?? "Multi-signal convergence";
    const sigPreview = c.signals.slice(0, 3).map((s) => s.title).join(" • ");

    return `
    <div style="border-left:3px solid ${color};padding:8px 12px;margin-bottom:8px;background:#0a1530;">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;">
        <span style="color:${color};font-size:9px;font-weight:bold;">CONVERGENCE ${Math.round(c.confidence * 100)}%</span>
        <span style="color:#5a7a9a;font-size:9px;">${c.type.replace(/_/g, " ").toUpperCase()}</span>
        ${validatedPredictions > 0 ? `<span style="color:#00ff88;font-size:9px;font-weight:bold;">✓ ${validatedPredictions} VALIDATED</span>` : ""}
      </div>
      <div style="color:#c0d0e0;font-size:12px;font-weight:bold;margin-bottom:4px;">${headline}</div>
      <div style="color:#7a8aa0;font-size:10px;line-height:1.4;">${sigPreview}</div>
      ${c.affectedRegions.length > 0 ? `<div style="color:#5a7a9a;font-size:9px;margin-top:4px;">📍 ${c.affectedRegions.join(", ")}</div>` : ""}
    </div>`;
  }).join("");

  return `
    <div style="border-top:1px solid #1a2a4a;padding-top:16px;margin-top:16px;margin-bottom:16px;">
      <h2 style="color:#00e5ff;font-size:13px;margin:0 0 8px 0;">⚛ SIGNAL CONVERGENCES</h2>
      <p style="color:#5a7a9a;font-size:10px;margin-bottom:12px;">Multi-source events that correlate across categories</p>
      ${cards}
    </div>`;
}

function buildPredictedDevelopmentsSection(convergences: Convergence[]): string {
  if (!convergences || convergences.length === 0) return "";

  // Aggregate all unvalidated predictions across high-confidence convergences
  const allPredictions = convergences
    .filter((c) => c.confidence >= 0.6)
    .flatMap((c) =>
      (c.predictions ?? [])
        .filter((p) => !p.validated)
        .map((p) => ({ pred: p, conv: c }))
    )
    .sort((a, b) => b.pred.probability - a.pred.probability)
    .slice(0, 6);

  if (allPredictions.length === 0) return "";

  const rows = allPredictions.map(({ pred, conv }) => {
    const hours = Math.round(pred.expectedWindowMs / 3_600_000);
    const color = confidenceColor(pred.probability);
    return `
    <tr>
      <td style="padding:4px 6px;color:${color};font-size:11px;font-weight:bold;">${pred.predictedCategory.toUpperCase()}</td>
      <td style="padding:4px 6px;color:#c0d0e0;font-size:10px;">within ${hours}h</td>
      <td style="padding:4px 6px;color:${color};font-size:10px;font-weight:bold;text-align:right;">${Math.round(pred.probability * 100)}%</td>
      <td style="padding:4px 6px;color:#5a7a9a;font-size:9px;">from ${conv.type.replace(/_/g, " ")}</td>
    </tr>`;
  }).join("");

  return `
    <div style="border-top:1px solid #1a2a4a;padding-top:16px;margin-top:16px;margin-bottom:16px;">
      <h2 style="color:#00e5ff;font-size:13px;margin:0 0 4px 0;">📡 EXPECTED DEVELOPMENTS</h2>
      <p style="color:#5a7a9a;font-size:10px;margin-bottom:12px;">Forward predictions from current convergences — what to watch next</p>
      <table style="width:100%;border-collapse:collapse;background:#0a1530;border:1px solid #1a2a4a;">
        ${rows}
      </table>
      <p style="color:#5a7a9a;font-size:8px;margin-top:8px;font-style:italic;">Predictions based on causal impact rules. Probability = rule strength × trigger reliability × convergence confidence.</p>
    </div>`;
}

async function fetchConvergencesFromCache(): Promise<Convergence[]> {
  try {
    const cached = await redis.get<ConvergenceResponse>(CONVERGENCE_KEYS.latest);
    return cached?.convergences ?? [];
  } catch (err) {
    console.error("[email-digest] convergence cache fetch failed:", err);
    return [];
  }
}

async function fetchCounterFactualsFromCache(): Promise<CounterFactualSignal[]> {
  try {
    return (
      (await redis.get<CounterFactualSignal[]>(CONVERGENCE_KEYS.counterFactuals)) ??
      []
    );
  } catch (err) {
    console.error("[email-digest] counter-factual cache fetch failed:", err);
    return [];
  }
}

function buildCounterFactualSection(signals: CounterFactualSignal[]): string {
  if (!signals || signals.length === 0) return "";

  // Only show missing_reaction / absent_signal — premature_silence is
  // too speculative for email (it might resolve in the next hour).
  const flagged = signals
    .filter((s) => s.kind === "missing_reaction" || s.kind === "absent_signal")
    .slice(0, 5);
  if (flagged.length === 0) return "";

  const color = (sev: CounterFactualSignal["severity"]): string =>
    sev === "high" ? "#a855f7" : sev === "elevated" ? "#8a5cf6" : "#6b46c1";

  const KIND_LABEL: Record<CounterFactualSignal["kind"], string> = {
    missing_reaction: "MISSING REACTION",
    absent_signal: "ABSENT SIGNAL",
    premature_silence: "EARLY WARNING",
  };

  const rows = flagged
    .map((s) => {
      const c = color(s.severity);
      const prob = Math.round(s.prediction.probability * 100);
      return `
    <div style="border-left:3px solid ${c};padding:8px 12px;margin-bottom:8px;background:#0a1530;">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;">
        <span style="color:${c};font-size:9px;font-weight:bold;">⚠ ${KIND_LABEL[s.kind]}</span>
        <span style="color:${c};font-size:9px;text-transform:uppercase;">${s.severity}</span>
      </div>
      <div style="color:#c0d0e0;font-size:11px;font-weight:bold;margin-bottom:4px;">
        Predicted <span style="color:${c};text-transform:uppercase;">${s.prediction.predictedCategory}</span> @ ${prob}% — did not appear
      </div>
      <div style="color:#7a8aa0;font-size:9px;line-height:1.4;">${s.reasoning}</div>
    </div>`;
    })
    .join("");

  return `
    <div style="border-top:1px solid #1a2a4a;padding-top:16px;margin-top:16px;margin-bottom:16px;">
      <h2 style="color:#a855f7;font-size:13px;margin:0 0 4px 0;">⚠ COUNTER-FACTUAL SIGNALS</h2>
      <p style="color:#5a7a9a;font-size:10px;margin-bottom:12px;">
        Predictions that did NOT materialize — possible reasons: markets pre-priced,
        triggers over-classified, or cascades averted.
      </p>
      ${rows}
    </div>`;
}

function buildDigestHtml(
  items: IntelItem[],
  frequency: string,
  convergences: Convergence[] = [],
  counterFactuals: CounterFactualSignal[] = []
): string {
  const sevCounts: Record<string, number> = {};
  items.forEach((i) => { sevCounts[i.severity] = (sevCounts[i.severity] || 0) + 1; });

  const topItems = items.slice(0, 15);
  const period = frequency === "weekly" ? "7 days" : "24 hours";

  // Phase A.11: convergence + predicted developments sections
  const convergenceSection = buildConvergenceSection(convergences);
  const predictionsSection = buildPredictedDevelopmentsSection(convergences);
  // HIGH #9: counter-factual section
  const counterFactualSection = buildCounterFactualSection(counterFactuals);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050a12;color:#c0d0e0;font-family:'Courier New',monospace;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="border-bottom:1px solid #1a2a4a;padding-bottom:16px;margin-bottom:16px;">
      <h1 style="color:#00e5ff;font-size:18px;margin:0;">WORLDSCOPE</h1>
      <p style="color:#5a7a9a;font-size:11px;margin:4px 0 0;">Intelligence Digest — Last ${period}</p>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:16px;">
      ${(["critical", "high", "medium", "low", "info"] as Severity[]).map((sev) =>
        `<span style="color:${SEVERITY_COLORS[sev]};font-size:11px;">${sev.toUpperCase()}: ${sevCounts[sev] || 0}</span>`
      ).join(" | ")}
    </div>

    <p style="color:#5a7a9a;font-size:10px;margin-bottom:12px;">Total: ${items.length} events</p>

    ${convergenceSection}
    ${predictionsSection}
    ${counterFactualSection}

    <h2 style="color:#00e5ff;font-size:13px;margin:16px 0 8px 0;border-top:1px solid #1a2a4a;padding-top:16px;">📰 TOP EVENTS</h2>

    ${topItems.map((item) => `
    <div style="border-left:3px solid ${SEVERITY_COLORS[item.severity]};padding:8px 12px;margin-bottom:8px;background:#0a1530;">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;">
        <span style="color:${SEVERITY_COLORS[item.severity]};font-size:9px;font-weight:bold;">${item.severity.toUpperCase()}</span>
        <span style="color:#5a7a9a;font-size:9px;">${item.category.toUpperCase()}</span>
      </div>
      <a href="${item.url}" style="color:#c0d0e0;font-size:12px;text-decoration:none;">${item.title}</a>
      <div style="color:#5a7a9a;font-size:9px;margin-top:4px;">${item.source} • ${new Date(item.publishedAt).toLocaleDateString()}</div>
    </div>
    `).join("")}

    <div style="border-top:1px solid #1a2a4a;padding-top:16px;margin-top:16px;text-align:center;">
      <a href="https://troiamedia.com" style="color:#00e5ff;font-size:10px;">Open WorldScope Dashboard →</a>
      <p style="color:#5a7a9a;font-size:8px;margin-top:8px;">You're receiving this because you subscribed to WorldScope digests.</p>
    </div>
  </div>
</body>
</html>`;
}

/** Send email digest to all active subscribers matching frequency */
export async function sendDigests(
  items: IntelItem[],
  frequency: "daily" | "weekly"
): Promise<{ sent: number; failed: number }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: 0, failed: 0 };

  const resend = new Resend(apiKey);
  const db = createServerClient();

  // Schema: categories live inside `preferences` JSON, not a top-level
  // column (confirmed 2026-04-22 via supabase gen types). The legacy
  // `email_subscribers` table never existed — this was a silent no-op.
  const { data: rawSubs } = await db
    .from("newsletter_subscribers")
    .select("id, email, frequency, preferences")
    .eq("is_active", true)
    .eq("frequency", frequency);

  if (!rawSubs || rawSubs.length === 0) return { sent: 0, failed: 0 };

  const subscribers = rawSubs.map((s) => {
    const prefs = (s.preferences ?? {}) as {
      categories?: unknown;
      last_sent_at?: unknown;
    };
    const categories = Array.isArray(prefs.categories)
      ? prefs.categories.filter((c): c is string => typeof c === "string")
      : [];
    return {
      id: s.id,
      email: s.email,
      frequency: s.frequency,
      categories,
      preferences: prefs as Record<string, unknown>,
    };
  });

  // Phase A.11: fetch convergences once for all subscribers
  const convergences = await fetchConvergencesFromCache();
  // HIGH #9: fetch counter-factuals once for all subscribers
  const counterFactuals = await fetchCounterFactualsFromCache();

  let sent = 0;
  let failed = 0;

  // Per-user cooldown: don't re-send if the last digest went out within
  // one frequency period (daily = 20h guard, weekly = 6.5-day guard).
  // Stops overlapping cron windows from double-delivering.
  const cooldownMs =
    frequency === "weekly"
      ? 6.5 * 24 * 60 * 60 * 1000
      : 20 * 60 * 60 * 1000;
  const now = Date.now();

  for (const sub of subscribers as Subscriber[]) {
    const lastSentRaw = sub.preferences.last_sent_at;
    if (typeof lastSentRaw === "string") {
      const lastSentMs = Date.parse(lastSentRaw);
      if (Number.isFinite(lastSentMs) && now - lastSentMs < cooldownMs) {
        continue;
      }
    }

    // Filter items by subscriber categories
    let filteredItems = items;
    if (sub.categories.length > 0) {
      filteredItems = items.filter((i) => sub.categories.includes(i.category));
    }

    if (filteredItems.length === 0) continue;

    // Filter convergences by subscriber categories too — only show
    // convergences that touch at least one of their interests.
    const subConvergences =
      sub.categories.length > 0
        ? convergences.filter((c) =>
            c.signals.some((s) => sub.categories.includes(s.category))
          )
        : convergences;

    try {
      const period = frequency === "weekly" ? "Weekly" : "Daily";
      await resend.emails.send({
        from: "WorldScope <digest@troiamedia.com>",
        to: sub.email,
        subject: `WorldScope ${period} Digest — ${filteredItems.length} events${subConvergences.length > 0 ? ` + ${subConvergences.length} convergences` : ""}`,
        html: buildDigestHtml(
          filteredItems,
          frequency,
          subConvergences,
          counterFactuals
        ),
      });

      sent++;
      // Stamp last-sent inside preferences JSON — `newsletter_subscribers`
      // has no dedicated timestamp column, so we piggy-back on the
      // existing Json column. Per-user rate limiting on digest emails
      // reads this back to skip re-sends within a cooldown window.
      const nextPrefs = { ...sub.preferences, last_sent_at: new Date().toISOString() };
      const { error: updErr } = await db
        .from("newsletter_subscribers")
        .update({ preferences: nextPrefs as unknown as import("@/types/supabase.generated").Json })
        .eq("id", sub.id);
      if (updErr) {
        console.error("[email-digest] last_sent stamp failed:", updErr.message);
      }
    } catch (err) {
      console.error("[email-digest] send failed:", err);
      failed++;
    }
  }

  return { sent, failed };
}
