import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/db/supabase";
import { AdSenseUnit, AdConsentBanner } from "@/components/ads";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Intelligence Reports — WorldScope",
  description:
    "AI-generated daily and weekly global intelligence reports. Analysis of conflicts, cybersecurity, finance, and geopolitical events.",
  openGraph: {
    title: "Intelligence Reports — WorldScope",
    description: "AI-generated daily and weekly global intelligence reports.",
    type: "website",
  },
};

export const revalidate = 3600; // ISR: revalidate every hour

interface ReportRow {
  id: string;
  type: "daily" | "weekly";
  lang: string;
  date: string;
  event_count: number;
  generated_at: string;
}

async function fetchReports(): Promise<ReportRow[]> {
  const db = createServerClient();
  const { data, error } = await db
    .from("reports")
    .select("id, type, lang, date, event_count, generated_at")
    .eq("lang", "en")
    .order("date", { ascending: false })
    .limit(60);

  if (error) return [];
  return (data as ReportRow[]) || [];
}

export default async function ReportsPage() {
  const reports = await fetchReports();

  const dailyReports = reports.filter((r) => r.type === "daily");
  const weeklyReports = reports.filter((r) => r.type === "weekly");

  return (
    <div className="min-h-screen bg-hud-base text-hud-text">
      {/* Header */}
      <header className="border-b border-hud-border bg-hud-surface">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <nav className="flex items-center gap-2 text-[10px] font-mono text-hud-muted mb-4">
            <Link href="/" className="text-hud-accent hover:underline">
              WORLDSCOPE
            </Link>
            <span>/</span>
            <span className="text-hud-text">REPORTS</span>
          </nav>

          <h1 className="font-mono text-2xl font-bold tracking-wide">
            Intelligence Reports
          </h1>
          <p className="font-mono text-xs text-hud-muted mt-2">
            AI-generated analysis of global events — updated daily and weekly
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Top ad */}
        <AdSenseUnit slot="5566778899" format="horizontal" />
        {/* Weekly Reports */}
        <section>
          <h2 className="font-mono text-[11px] font-bold text-hud-accent tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-severity-high" />
            WEEKLY REPORTS
          </h2>

          {weeklyReports.length === 0 ? (
            <p className="font-mono text-xs text-hud-muted bg-hud-surface border border-hud-border rounded-md p-4">
              No weekly reports generated yet. Check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {weeklyReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </section>

        {/* Daily Reports */}
        <section>
          <h2 className="font-mono text-[11px] font-bold text-hud-accent tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-hud-accent" />
            DAILY REPORTS
          </h2>

          {dailyReports.length === 0 ? (
            <p className="font-mono text-xs text-hud-muted bg-hud-surface border border-hud-border rounded-md p-4">
              No daily reports generated yet. Check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dailyReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </section>

        {/* Back link */}
        <div className="pt-4 border-t border-hud-border">
          <Link
            href="/"
            className="font-mono text-xs text-hud-accent hover:underline"
          >
            ← Back to Live Dashboard
          </Link>
        </div>
      </main>

      <AdConsentBanner />
    </div>
  );
}

function ReportCard({ report }: { report: ReportRow }) {
  const dateObj = new Date(report.date + "T00:00:00Z");
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isWeekly = report.type === "weekly";

  return (
    <Link
      href={`/reports/${report.type}/${report.date}`}
      className="group block bg-hud-surface border border-hud-border rounded-md p-4 hover:border-hud-muted transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isWeekly ? "bg-severity-high" : "bg-hud-accent"
          }`}
        />
        <span className="font-mono text-[9px] font-bold tracking-wider text-hud-muted uppercase">
          {report.type} report
        </span>
      </div>

      <p className="text-sm text-hud-text group-hover:text-hud-accent transition-colors">
        {formattedDate}
      </p>

      <div className="flex items-center justify-between mt-3">
        <span className="font-mono text-[9px] text-hud-muted">
          {report.event_count} events analyzed
        </span>
        <span className="font-mono text-[9px] text-hud-accent opacity-0 group-hover:opacity-100 transition-opacity">
          READ →
        </span>
      </div>
    </Link>
  );
}
