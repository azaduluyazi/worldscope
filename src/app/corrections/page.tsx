import type { Metadata } from "next";
import { createServerClient } from "@/lib/db/supabase";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";

// Skip build prerender — Supabase query exceeded 60s build worker limit
// (same pattern as /country, /entity, /blog, /blog/feed.xml). Render on
// request; CDN caches per the revalidate window below.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://troiamedia.com";

export const metadata: Metadata = {
  title: "Corrections — TroiaMedia / WorldScope",
  description:
    "Public corrections log. Every material error WorldScope has corrected, listed with the date, the original claim, and the fix.",
  alternates: { canonical: `${SITE_URL}/corrections` },
};

interface Correction {
  id: string;
  date: string;
  url: string;
  headline: string;
  original_claim: string;
  correction: string;
}

async function getCorrections(): Promise<Correction[]> {
  try {
    const db = createServerClient();
    const { data } = await db
      .from("corrections")
      .select("id, date, url, headline, original_claim, correction")
      .order("date", { ascending: false })
      .limit(200);
    return (data as Correction[]) || [];
  } catch {
    return [];
  }
}

export default async function CorrectionsPage() {
  const corrections = await getCorrections();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Corrections", url: `${SITE_URL}/corrections` },
        ]}
      />
      <main className="min-h-screen bg-hud-base text-hud-text overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
          <div className="font-mono text-[10px] text-hud-accent uppercase tracking-[0.2em] mb-2">
            PUBLIC LOG
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Corrections
          </h1>
          <p className="font-mono text-xs text-hud-muted mb-8 leading-relaxed">
            Every material error WorldScope has published and corrected is
            listed here. See our{" "}
            <a href="/editorial-policy" className="text-hud-accent underline">
              editorial policy
            </a>{" "}
            for how we handle corrections. Report an error:{" "}
            <a
              href="mailto:corrections@troiamedia.com"
              className="text-hud-accent underline"
            >
              corrections@troiamedia.com
            </a>
            .
          </p>

          {corrections.length === 0 ? (
            <div className="border border-hud-border/50 rounded-lg p-6 bg-hud-panel/40 text-center">
              <div className="font-mono text-xs text-hud-muted">
                No corrections to date. We log every material error here when
                it happens.
              </div>
            </div>
          ) : (
            <ul className="space-y-4">
              {corrections.map((c) => (
                <li
                  key={c.id}
                  className="border border-hud-border/50 rounded-lg p-4 bg-hud-panel/40"
                >
                  <div className="font-mono text-[10px] text-hud-accent uppercase tracking-wider mb-1">
                    {c.date}
                  </div>
                  <a
                    href={c.url}
                    className="font-mono text-sm text-hud-text hover:text-hud-accent"
                  >
                    {c.headline}
                  </a>
                  <div className="mt-2 font-mono text-[11px] text-hud-muted">
                    <strong>Original:</strong> {c.original_claim}
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-hud-muted">
                    <strong>Correction:</strong> {c.correction}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
