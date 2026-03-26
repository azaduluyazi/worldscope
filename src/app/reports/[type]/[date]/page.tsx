import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/db/supabase";
import { AdSenseUnit, CarbonAd, AdConsentBanner } from "@/components/ads";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // ISR: revalidate every hour

interface ReportRow {
  id: string;
  type: "daily" | "weekly";
  lang: string;
  date: string;
  content: string;
  event_count: number;
  generated_at: string;
}

type ReportType = "daily" | "weekly";

const VALID_TYPES = new Set<ReportType>(["daily", "weekly"]);

async function fetchReport(
  type: string,
  date: string,
  lang = "en"
): Promise<ReportRow | null> {
  if (!VALID_TYPES.has(type as ReportType)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const db = createServerClient();
  const { data, error } = await db
    .from("reports")
    .select("*")
    .eq("type", type)
    .eq("lang", lang)
    .eq("date", date)
    .single();

  if (error || !data) return null;
  return data as ReportRow;
}

/* ── Dynamic metadata ── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; date: string }>;
}): Promise<Metadata> {
  const { type, date } = await params;
  const report = await fetchReport(type, date);

  if (!report) {
    return { title: "Report Not Found — WorldScope" };
  }

  const dateStr = new Date(report.date + "T00:00:00Z").toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const title = `${capitalize(report.type)} Intelligence Report — ${dateStr} — WorldScope`;
  const description = `WorldScope ${report.type} intelligence report for ${dateStr}. Analysis of ${report.event_count} global events covering conflicts, cybersecurity, finance, and geopolitics.`;

  const ogImageUrl = `/api/og/report?type=${report.type}&date=${report.date}&events=${report.event_count}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

/* ── Page component ── */
export default async function ReportPage({
  params,
}: {
  params: Promise<{ type: string; date: string }>;
}) {
  const { type, date } = await params;
  const report = await fetchReport(type, date);
  if (!report) notFound();

  const dateStr = new Date(report.date + "T00:00:00Z").toLocaleDateString(
    "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );

  const generatedAt = new Date(report.generated_at).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const isWeekly = report.type === "weekly";

  return (
    <div className="min-h-screen bg-hud-base text-hud-text">
      {/* Header */}
      <header className="border-b border-hud-border bg-hud-surface">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <nav className="flex items-center gap-2 text-[10px] font-mono text-hud-muted mb-4">
            <Link href="/" className="text-hud-accent hover:underline">
              WORLDSCOPE
            </Link>
            <span>/</span>
            <Link href="/reports" className="text-hud-accent hover:underline">
              REPORTS
            </Link>
            <span>/</span>
            <span className="text-hud-text uppercase">{report.type}</span>
            <span>/</span>
            <span className="text-hud-text">{report.date}</span>
          </nav>

          <div className="flex items-center gap-3 mb-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isWeekly ? "bg-severity-high" : "bg-hud-accent"
              }`}
            />
            <span className="font-mono text-[10px] font-bold tracking-wider text-hud-muted uppercase">
              {report.type} intelligence report
            </span>
          </div>

          <h1 className="font-mono text-xl font-bold tracking-wide">{dateStr}</h1>

          <div className="flex items-center gap-4 mt-3 font-mono text-[9px] text-hud-muted">
            <span>{report.event_count} events analyzed</span>
            <span>•</span>
            <span>Generated {generatedAt}</span>
            <span>•</span>
            <span>AI-powered analysis</span>
          </div>
        </div>
      </header>

      {/* Report content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Top ad */}
        <div className="mb-6">
          <AdSenseUnit slot="0987654321" format="horizontal" />
        </div>

        <article className="bg-hud-surface border border-hud-border rounded-md p-6 md:p-8">
          <ReportContent content={report.content} />
        </article>

        {/* Share buttons */}
        <ShareButtons
          type={report.type}
          date={report.date}
          dateStr={dateStr}
          eventCount={report.event_count}
        />

        {/* Post-article ad */}
        <div className="mt-6">
          <CarbonAd />
        </div>

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: `${capitalize(report.type)} Intelligence Report — ${dateStr}`,
              datePublished: report.generated_at,
              dateModified: report.generated_at,
              author: {
                "@type": "Organization",
                name: "WorldScope AI",
                url: "https://worldscope.app",
              },
              publisher: {
                "@type": "Organization",
                name: "WorldScope",
                url: "https://worldscope.app",
              },
              description: `Analysis of ${report.event_count} global intelligence events.`,
              articleSection: "Intelligence Report",
            }),
          }}
        />

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-hud-border">
          <Link
            href="/reports"
            className="font-mono text-xs text-hud-accent hover:underline"
          >
            ← All Reports
          </Link>
          <Link
            href="/"
            className="font-mono text-xs text-hud-accent hover:underline"
          >
            Live Dashboard →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hud-border bg-hud-surface mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="font-mono text-[9px] text-hud-muted">
            WorldScope — AI-Generated Intelligence Reports • Updated daily
          </p>
        </div>
      </footer>

      <AdConsentBanner />
    </div>
  );
}

/** Render markdown-like report content as styled HTML */
function ReportContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        // ## Headings
        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={i}
              className="font-mono text-sm font-bold text-hud-accent tracking-wider mt-6 mb-2 border-b border-hud-border pb-1"
            >
              {trimmed.replace("## ", "")}
            </h2>
          );
        }

        // # Main heading
        if (trimmed.startsWith("# ")) {
          return (
            <h1
              key={i}
              className="font-mono text-lg font-bold text-hud-text tracking-wide mt-4 mb-3"
            >
              {trimmed.replace("# ", "")}
            </h1>
          );
        }

        // - Bullet points
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={i} className="flex items-start gap-2 ml-2">
              <span className="text-hud-accent mt-1 text-[8px]">▸</span>
              <p className="text-[13px] text-hud-text leading-relaxed flex-1">
                <InlineMarkdown text={trimmed.slice(2)} />
              </p>
            </div>
          );
        }

        // Numbered items
        if (/^\d+\.\s/.test(trimmed)) {
          const numMatch = trimmed.match(/^(\d+)\.\s(.*)$/);
          if (numMatch) {
            return (
              <div key={i} className="flex items-start gap-2 ml-2">
                <span className="font-mono text-[10px] text-hud-accent min-w-[16px]">
                  {numMatch[1]}.
                </span>
                <p className="text-[13px] text-hud-text leading-relaxed flex-1">
                  <InlineMarkdown text={numMatch[2]} />
                </p>
              </div>
            );
          }
        }

        // Regular paragraph
        return (
          <p key={i} className="text-[13px] text-hud-text leading-relaxed">
            <InlineMarkdown text={trimmed} />
          </p>
        );
      })}
    </div>
  );
}

/** Simple inline markdown: **bold** */
function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="text-hud-accent font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/** Social media share buttons */
function ShareButtons({
  type,
  date,
  dateStr,
  eventCount,
}: {
  type: string;
  date: string;
  dateStr: string;
  eventCount: number;
}) {
  const reportUrl = `https://troiamedia.com/reports/${type}/${date}`;
  const text = `WorldScope ${capitalize(type)} Intelligence Report — ${dateStr} — ${eventCount} events analyzed`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(reportUrl)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(reportUrl)}`;
  const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(reportUrl)}&title=${encodeURIComponent(text)}`;

  return (
    <div className="mt-6 flex items-center gap-3">
      <span className="font-mono text-[9px] text-hud-muted tracking-wider">SHARE:</span>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-[9px] px-3 py-1.5 bg-hud-surface border border-hud-border rounded hover:border-hud-accent/50 hover:text-hud-accent text-hud-muted transition-colors"
      >
        𝕏 TWITTER
      </a>
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-[9px] px-3 py-1.5 bg-hud-surface border border-hud-border rounded hover:border-[#0077b5]/50 hover:text-[#0077b5] text-hud-muted transition-colors"
      >
        LINKEDIN
      </a>
      <a
        href={redditUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-[9px] px-3 py-1.5 bg-hud-surface border border-hud-border rounded hover:border-[#ff4500]/50 hover:text-[#ff4500] text-hud-muted transition-colors"
      >
        REDDIT
      </a>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
