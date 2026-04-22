import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const revalidate = 3600;

/**
 * GET /api/reports/sunday
 *
 * Returns the latest Sunday Convergence Report as Markdown-as-JSON.
 * A separate build step (or the digest mailer cron) converts this to
 * PDF via an LLM + wkhtmltopdf pipeline.
 *
 * Query:
 *   ?format=md   — raw markdown (default)
 *   ?format=html — minimally formatted HTML (for preview + PDF rendering)
 *
 * Data source: `reports` table filtered to type='weekly', latest Sunday.
 * Aggregates top convergence storylines + regional risk shifts from
 * `convergence_storylines` when present.
 */

interface Report {
  date: string;
  type: string;
  content: string;
  event_count: number;
  generated_at: string;
}

interface Storyline {
  id: string;
  headline: string;
  regions: string[];
  sourceCount: number;
  confidence: number;
  createdAt: string;
}

async function getLatestSundayReport(): Promise<Report | null> {
  try {
    const db = createServerClient();
    const { data } = await db
      .from("reports")
      .select("date, type, content, event_count, generated_at")
      .eq("lang", "en")
      .eq("type", "weekly")
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();
    if (!data) return null;
    return {
      date: data.date,
      type: data.type,
      content: data.content,
      event_count: data.event_count ?? 0,
      generated_at: data.generated_at ?? new Date().toISOString(),
    };
  } catch (err) {
    console.error("[reports/sunday]", err);
    return null;
  }
}

async function getTopStorylines(since: string): Promise<Storyline[]> {
  try {
    const db = createServerClient();
    // Column map vs. pre-2026-04-22 drift: title→headline, regions→
    // affected_regions, confidence→peak_confidence, source_count→
    // snapshots.length (JSONB array). There is no `summary` column —
    // the UI previously crashed silently on this.
    const { data } = await db
      .from("convergence_storylines")
      .select("id, headline, affected_regions, snapshots, peak_confidence, created_at")
      .gte("created_at", since)
      .order("peak_confidence", { ascending: false })
      .limit(10);
    return (data ?? []).map((row) => ({
      id: row.id,
      headline: row.headline,
      regions: row.affected_regions ?? [],
      sourceCount: Array.isArray(row.snapshots) ? row.snapshots.length : 0,
      confidence: row.peak_confidence,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error("[reports/sunday]", err);
    return [];
  }
}

function buildMarkdown(report: Report | null, stories: Storyline[]): string {
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const date = now.toISOString().slice(0, 10);

  const parts: string[] = [];
  parts.push(`# The Sunday Convergence Report`);
  parts.push(`**Week of ${weekStart.toISOString().slice(0, 10)} → ${date}**`);
  parts.push(``);
  parts.push(
    `*Signals that converged across multiple sources over the past 7 days, surfaced by WorldScope's semantic-dedup engine from 689 monitored sources across 195 countries.*`,
  );
  parts.push(``);
  parts.push(`---`);
  parts.push(``);

  if (stories.length > 0) {
    parts.push(`## 01 · What the signals agree on`);
    parts.push(``);
    stories.slice(0, 5).forEach((s, idx) => {
      parts.push(`### ${idx + 1}. ${s.headline}`);
      parts.push(
        `> **Regions:** ${(s.regions || []).join(", ") || "Global"} · **Sources:** ${s.sourceCount} · **Confidence:** ${Math.round(s.confidence * 100)}%`,
      );
      parts.push(``);
    });
  }

  if (report?.content) {
    parts.push(`## 02 · Weekly Intelligence Digest`);
    parts.push(``);
    parts.push(report.content);
    parts.push(``);
  }

  parts.push(`---`);
  parts.push(``);
  parts.push(
    `*The Sunday Convergence Report is sent by [WorldScope at TroiaMedia](https://troiamedia.com). Free forever. Unsubscribe anytime by clicking the link at the bottom of the email.*`,
  );
  parts.push(``);
  parts.push(`© ${now.getFullYear()} TroiaMedia · Editorial policy: https://troiamedia.com/editorial-policy`);

  return parts.join("\n");
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^# (.+)$/gm, '<h1 style="font-size:28px;color:#00e5ff;margin-top:0;">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:16px;color:#00e5ff;text-transform:uppercase;letter-spacing:2px;margin-top:24px;">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:14px;color:#e8f0fc;margin-top:16px;">$1</h3>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:2px solid #00e5ff;padding-left:12px;color:#9fb3d9;font-size:11px;margin:8px 0;">$1</blockquote>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\*(.+?)\*$/gm, '<em style="color:#9fb3d9;">$1</em>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #1a2540;margin:24px 0;" />')
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hb])/gm, "");
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const format = (url.searchParams.get("format") || "md").toLowerCase();

  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [report, stories] = await Promise.all([
    getLatestSundayReport(),
    getTopStorylines(weekAgo),
  ]);

  const md = buildMarkdown(report, stories);

  if (format === "html") {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>The Sunday Convergence Report</title></head><body style="font-family:'JetBrains Mono',monospace;background:#050a12;color:#e8f0fc;max-width:700px;margin:40px auto;padding:20px;line-height:1.6;"><p>${markdownToHtml(md)}</p></body></html>`;
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  }

  return NextResponse.json({
    ok: true,
    date: new Date().toISOString().slice(0, 10),
    title: "The Sunday Convergence Report",
    markdown: md,
    stats: {
      stories_included: stories.length,
      base_report_present: !!report,
      source_count: 689,
      country_count: 195,
    },
  });
}
