import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/db/supabase";

// Skip build prerender — /newsletter/sample build worker hit the 60s
// limit on the deploy at 2026-04-22 09:51 (user-reported). Dynamic
// render + CDN cache via revalidate below.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sample Intelligence Briefing — WorldScope",
  description:
    "Preview a WorldScope daily intelligence briefing. AI-curated threat assessments, market impact analysis, and global event tracking from 570+ sources.",
  openGraph: {
    title: "Sample Intelligence Briefing — WorldScope",
    description:
      "See what a WorldScope daily briefing looks like before subscribing.",
    type: "website",
  },
  alternates: { canonical: "https://troiamedia.com/newsletter/sample" },
};

interface Report {
  type: string;
  date: string;
  content: string;
  event_count: number;
}

async function getLatestReport(): Promise<Report | null> {
  try {
    const db = createServerClient();
    const { data } = await db
      .from("reports")
      .select("type, date, content, event_count")
      .eq("lang", "en")
      .eq("type", "daily")
      .order("date", { ascending: false })
      .limit(1)
      .single();
    return data;
  } catch {
    return null;
  }
}

/** Convert markdown-ish report text to basic HTML */
function markdownToHtml(text: string): string {
  return text
    .replace(/^## (.+)$/gm, '<h2 class="text-hud-accent font-mono text-sm font-bold mt-6 mb-2 uppercase tracking-wider">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-hud-text font-mono text-xs font-semibold mt-4 mb-1">$1</h3>')
    .replace(/^\- \*\*(.+?)\*\*:?\s*(.*)$/gm, '<li class="mb-1"><strong class="text-hud-text">$1:</strong> $2</li>')
    .replace(/^\- (.+)$/gm, "<li>$1</li>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/^(?!<[hlu])/gm, "")
    .replace(/<li>/g, '<li class="text-hud-muted text-xs leading-relaxed">')
    .replace(/<p>/g, '<p class="text-hud-muted text-xs leading-relaxed mb-2">');
}

export default async function SampleNewsletterPage() {
  const report = await getLatestReport();

  return (
    <main className="min-h-screen bg-hud-base text-hud-text">
      {/* Hero */}
      <section className="border-b border-hud-border bg-hud-panel/50 px-6 py-12 text-center">
        <div className="font-mono text-[10px] text-hud-accent tracking-widest uppercase mb-2">
          SAMPLE BRIEFING
        </div>
        <h1 className="font-mono text-2xl font-bold text-hud-text">
          Daily Intelligence Briefing
        </h1>
        <p className="mt-2 text-sm text-hud-muted max-w-xl mx-auto">
          This is what WorldScope subscribers receive every morning — AI-curated
          intelligence from 570+ verified sources across 195 countries.
        </p>
      </section>

      {/* Email preview */}
      <section className="max-w-2xl mx-auto px-4 py-8">
        <div className="border border-hud-border rounded-lg overflow-hidden">
          {/* Email header mock */}
          <div className="bg-hud-panel/80 border-b border-hud-border px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-hud-accent/20 flex items-center justify-center font-mono text-hud-accent text-xs font-bold">
                WS
              </div>
              <div>
                <div className="font-mono text-[11px] text-hud-text font-medium">
                  WorldScope Intelligence
                </div>
                <div className="font-mono text-[9px] text-hud-muted">
                  briefing@troiamedia.com
                </div>
              </div>
              <div className="ml-auto font-mono text-[9px] text-hud-muted">
                {report
                  ? new Date(report.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Today"}
              </div>
            </div>
          </div>

          {/* Email body */}
          <div className="bg-hud-base/50 px-5 py-6">
            {report ? (
              <>
                <div className="font-mono text-[9px] text-hud-accent tracking-wider uppercase mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-hud-accent" />
                  DAILY INTELLIGENCE REPORT — {report.event_count} EVENTS TRACKED
                </div>
                <div
                  dangerouslySetInnerHTML={{
                    __html: markdownToHtml(report.content),
                  }}
                />
              </>
            ) : (
              <div className="text-center py-10">
                <p className="font-mono text-sm text-hud-muted">
                  No sample briefing available yet. Check back tomorrow.
                </p>
              </div>
            )}
          </div>

          {/* Email footer mock */}
          <div className="bg-hud-panel/40 border-t border-hud-border px-5 py-3 text-center">
            <div className="font-mono text-[8px] text-hud-muted/60">
              WorldScope — Real-time Global Intelligence | troiamedia.com |
              Unsubscribe
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="font-mono text-xs text-hud-muted mb-4">
            Get this briefing delivered to your inbox every morning — free.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/#subscribe"
              className="px-6 py-2.5 bg-hud-accent/20 border border-hud-accent/50 rounded font-mono text-xs text-hud-accent hover:bg-hud-accent/30 transition-colors"
            >
              Subscribe — Daily
            </Link>
            <Link
              href="/pricing#gaia"
              className="px-6 py-2.5 bg-amber-400 text-[#060509] rounded font-mono text-xs font-bold hover:bg-amber-300 transition-colors"
            >
              Subscribe · $9/mo
            </Link>
          </div>
          <div className="mt-3 font-mono text-[8px] text-hud-muted/50">
            Part of Gaia · 689 sources · 195 countries · Cancel anytime
          </div>
        </div>

        {/* Back */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="font-mono text-[10px] text-hud-accent hover:underline"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </section>

      {/* SEO */}
      <section className="sr-only">
        <h2>WorldScope Daily Intelligence Briefing</h2>
        <p>
          Subscribe to receive AI-curated intelligence summaries from 570+
          verified sources. Daily and weekly frequency options. Covers conflicts,
          cybersecurity, markets, energy, and geopolitics across 195 countries.
        </p>
      </section>
    </main>
  );
}
