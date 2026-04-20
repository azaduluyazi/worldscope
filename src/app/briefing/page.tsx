import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
// BriefingSignupForm removed 2026-04-20 — free email collection paused
// while Gaia ($9/mo) merchant-of-record review completes. See
// wiki/sorunlar/briefing-free-signup-still-open.md.
import {
  NewsArticleSchema,
  BreadcrumbSchema,
  SpeakableSchema,
} from "@/components/seo/StructuredData";
import {
  BRIEFING_COOKIE,
  getVariant,
} from "@/lib/ab/briefing-headline";

// A/B test reads a per-visitor cookie set by middleware; rendering
// must be dynamic so each visitor sees their own variant.
export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://troiamedia.com";

export const metadata: Metadata = {
  title:
    "The Sunday Convergence Report — Real-Time Global Intelligence Briefing",
  description:
    "Join analysts, traders and journalists receiving a weekly AI-curated intelligence digest. 689 sources, 195 countries, one PDF every Sunday morning. Free forever.",
  alternates: { canonical: `${SITE_URL}/briefing` },
  openGraph: {
    title: "The Sunday Convergence Report — WorldScope Briefing",
    description:
      "Weekly AI-curated intelligence digest delivered as a PDF every Sunday. 689 sources, 195 countries.",
    type: "website",
    url: `${SITE_URL}/briefing`,
  },
  twitter: {
    card: "summary_large_image",
    title: "The Sunday Convergence Report",
    description:
      "Weekly AI-curated global intelligence digest. 689 sources, 195 countries. Free PDF.",
  },
};

export default async function BriefingLandingPage() {
  const now = new Date().toISOString();
  const cookieStore = await cookies();
  const variantId = cookieStore.get(BRIEFING_COOKIE)?.value;
  const v = getVariant(variantId);

  return (
    <>
      <NewsArticleSchema
        headline="The Sunday Convergence Report — Weekly Intelligence Briefing"
        description="Subscribe to TroiaMedia's weekly AI-curated intelligence digest. 689 sources, 195 countries, delivered as a PDF every Sunday."
        url={`${SITE_URL}/briefing`}
        datePublished={now}
        dateModified={now}
        section="Intelligence"
        keywords={[
          "OSINT",
          "intelligence briefing",
          "global monitoring",
          "real-time intelligence",
          "geopolitical risk",
          "cyber threat intelligence",
          "newsletter",
        ]}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Briefing", url: `${SITE_URL}/briefing` },
        ]}
      />
      <SpeakableSchema
        cssSelectors={["h1", ".briefing-lede", ".briefing-summary"]}
      />

      <div
        className="min-h-screen bg-hud-base text-hud-text overflow-y-auto"
        data-briefing-variant={v.id}
      >
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
          {/* Hero — A/B tested headline */}
          <div className="text-center mb-12">
            <div className="inline-block font-mono text-[10px] text-hud-accent tracking-[0.2em] uppercase mb-4 border border-hud-accent/30 px-3 py-1 rounded-full">
              {v.eyebrow}
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              {v.headlineLine1}
              <br />
              <span className="text-hud-accent">{v.headlineLine2}</span>
            </h1>
            <p className="briefing-lede max-w-2xl mx-auto font-mono text-sm md:text-base text-hud-muted leading-relaxed">
              {v.lede}
            </p>
          </div>

          {/* Signup — temporarily paused while the Gaia ($9/mo) paid tier
              completes its merchant-of-record review. The form used to
              collect free email signups here; that behaviour is retired
              pending the paid checkout flow per user decision on
              2026-04-20. */}
          <div className="max-w-xl mx-auto mb-16">
            <div className="border border-amber-400/40 bg-amber-400/5 rounded-md p-5 text-center">
              <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-amber-300 mb-2">
                ◈ Launching soon — Γαῖα / Gaia tier
              </div>
              <p className="font-mono text-xs text-gray-300 leading-relaxed mb-4">
                The Sunday Convergence Report is moving behind Gaia ($9/mo global
                briefing). Sign up for an account now — when the tier opens
                you&apos;ll be one click away from enrolling.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link
                  href="/sign-up?redirect_url=/briefing"
                  className="inline-block px-4 py-2 font-mono text-[11px] font-bold tracking-wider bg-amber-400 text-[#060509] hover:bg-amber-300 transition-colors"
                >
                  CREATE ACCOUNT
                </Link>
                <Link
                  href="/pricing#gaia"
                  className="inline-block px-4 py-2 font-mono text-[11px] font-bold tracking-wider border border-amber-400/50 text-amber-300 hover:bg-amber-400/10 transition-colors"
                >
                  SEE GAIA →
                </Link>
              </div>
            </div>
            <div className="text-center font-mono text-[10px] text-hud-muted mt-3">
              Existing subscribers: your delivery is uninterrupted. No action needed.
            </div>
          </div>

          {/* What's inside */}
          <div className="grid md:grid-cols-3 gap-4 mb-16">
            <div className="border border-hud-border/50 rounded-lg p-4 bg-hud-panel/40">
              <div className="font-mono text-[10px] text-hud-accent uppercase tracking-wider mb-2">
                01 · CONVERGENCE
              </div>
              <h3 className="font-mono text-sm text-hud-text mb-1">
                What the signals agree on
              </h3>
              <p className="font-mono text-[11px] text-hud-muted leading-relaxed">
                Cross-source patterns surfaced by our semantic-dedup engine —
                not another headline dump.
              </p>
            </div>
            <div className="border border-hud-border/50 rounded-lg p-4 bg-hud-panel/40">
              <div className="font-mono text-[10px] text-hud-accent uppercase tracking-wider mb-2">
                02 · RISK SHIFTS
              </div>
              <h3 className="font-mono text-sm text-hud-text mb-1">
                Where tension moved this week
              </h3>
              <p className="font-mono text-[11px] text-hud-muted leading-relaxed">
                Region-by-region threat delta plus the cyber + finance cross-
                section most desks miss.
              </p>
            </div>
            <div className="border border-hud-border/50 rounded-lg p-4 bg-hud-panel/40">
              <div className="font-mono text-[10px] text-hud-accent uppercase tracking-wider mb-2">
                03 · WHAT TO WATCH
              </div>
              <h3 className="font-mono text-sm text-hud-text mb-1">
                Next 7 days, triaged
              </h3>
              <p className="font-mono text-[11px] text-hud-muted leading-relaxed">
                Scheduled inflection points — elections, summits, index
                rebalances — with likelihood and impact notes.
              </p>
            </div>
          </div>

          {/* Who subscribes */}
          <div className="briefing-summary border-t border-b border-hud-border/40 py-8 mb-12">
            <div className="text-center font-mono text-[10px] text-hud-accent uppercase tracking-wider mb-4">
              READ BY
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono text-[11px] text-hud-muted">
              <div>
                <div className="text-hud-text text-lg font-bold">Analysts</div>
                <div>Defense &amp; intel</div>
              </div>
              <div>
                <div className="text-hud-text text-lg font-bold">Traders</div>
                <div>Macro &amp; FX desks</div>
              </div>
              <div>
                <div className="text-hud-text text-lg font-bold">
                  Journalists
                </div>
                <div>Foreign bureaus</div>
              </div>
              <div>
                <div className="text-hud-text text-lg font-bold">
                  Researchers
                </div>
                <div>Think tanks &amp; academia</div>
              </div>
            </div>
          </div>

          {/* Preview link */}
          <div className="text-center mb-12">
            <Link
              href="/newsletter/sample"
              className="inline-block font-mono text-[11px] text-hud-accent border border-hud-accent/40 px-4 py-2 rounded hover:bg-hud-accent/10 transition-colors"
            >
              READ A SAMPLE BRIEFING →
            </Link>
          </div>

          {/* Trust footer */}
          <div className="text-center font-mono text-[10px] text-hud-muted/60 space-y-1">
            <div>
              Powered by{" "}
              <Link href="/" className="underline hover:text-hud-accent">
                WorldScope
              </Link>{" "}
              · 689 sources · 195 countries · 30 languages
            </div>
            <div>
              Editorial policy ·{" "}
              <Link href="/editorial-policy" className="underline">
                read here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
