import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/shared/LegalFooter";
import { AdSenseUnit, AdConsentBanner } from "@/components/ads";
import { AD_PLACEMENTS } from "@/config/ads";
import { NewsletterPopup } from "@/components/shared/NewsletterPopup";

export const metadata: Metadata = {
  title: "About — WorldScope",
  description:
    "WorldScope is a real-time global news monitoring SaaS platform aggregating 2000+ sources across 30 languages. Operated by Troia Media.",
  openGraph: {
    title: "About — WorldScope",
    description:
      "Real-time global news monitoring platform. 2000+ sources, 30 languages, free to use.",
    type: "website",
  },
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-hud-base text-hud-text p-6 font-mono">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-hud-muted hover:text-hud-accent transition-colors mb-6"
        >
          &larr; Back to Dashboard
        </Link>

        <h1 className="text-xl font-bold text-hud-accent mb-1 tracking-wider uppercase">
          About WorldScope
        </h1>
        <p className="text-hud-muted text-xs mb-8">
          Real-Time Global News Monitoring Software
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-hud-text/90">
          {/* Operator Info */}
          <Section title="Operator">
            <div className="space-y-1">
              <p><strong>Service:</strong> WorldScope — troiamedia.com</p>
              <p><strong>Operated by:</strong> Azad Uluyazi (Sole Proprietor)</p>
              <p><strong>Trading as:</strong> Troia Media</p>
              <p><strong>Location:</strong> Istanbul, Turkey</p>
              <p>
                <strong>Contact:</strong>{" "}
                <a href="mailto:info@troiamedia.com" className="text-hud-accent hover:underline">
                  info@troiamedia.com
                </a>
              </p>
            </div>
          </Section>

          {/* Editor — explicit human accountability for E-E-A-T */}
          <Section title="Editor and Principal Analyst">
            <p className="mb-3">
              WorldScope is designed, operated, and editorially supervised by{" "}
              <strong>Azad Uluyazi</strong>, an independent technologist based in
              Istanbul with a decade of hands-on experience building data-driven
              web platforms, API integrations, and real-time information
              pipelines. Azad is personally responsible for source selection,
              editorial policy, AI-assisted output review, and every
              human-reviewed report published on the platform.
            </p>
            <ul className="list-disc list-inside space-y-1 text-hud-text/80">
              <li>
                <strong>Focus areas:</strong> open-source intelligence (OSINT),
                geopolitical risk monitoring, cybersecurity threat aggregation,
                macroeconomic signal detection, full-stack engineering.
              </li>
              <li>
                <strong>Platform responsibilities:</strong> source vetting
                pipeline, AI prompt design and review, severity taxonomy,
                editorial corrections, user-facing communication.
              </li>
              <li>
                <strong>Public contact:</strong> editorial or correction
                requests at{" "}
                <a
                  href="mailto:info@troiamedia.com"
                  className="text-hud-accent hover:underline"
                >
                  info@troiamedia.com
                </a>{" "}
                — every inquiry is answered by the same person who runs the
                platform, not an anonymous support queue.
              </li>
            </ul>
            <p className="mt-3 text-xs text-hud-muted">
              WorldScope does not employ ghostwritten bylines. Where a
              human-authored analysis is attributed, it reflects Azad&apos;s own
              review and sign-off. AI drafts are explicitly labeled and reviewed
              before publication — see the{" "}
              <Link href="/editorial-policy" className="text-hud-accent hover:underline">
                Editorial Policy
              </Link>{" "}
              for the full review workflow.
            </p>
          </Section>

          <Section title="Mission">
            <p>
              WorldScope is a web-based software platform (SaaS) that makes
              global news and public data accessible to everyone. Our software
              aggregates, organizes, and presents real-time information from
              thousands of publicly available sources worldwide — news agencies,
              government data feeds, financial markets, weather services, and
              more — in a single, interactive dashboard application.
            </p>
          </Section>

          <Section title="What We Monitor">
            <div className="grid grid-cols-2 gap-3 mt-2">
              <StatBlock label="Data Sources" value="2,000+" />
              <StatBlock label="Live Feeds" value="37" />
              <StatBlock label="News Channels" value="232" />
              <StatBlock label="RSS Feeds" value="549" />
              <StatBlock label="Languages" value="30" />
              <StatBlock label="API Clients" value="137" />
            </div>
          </Section>

          <Section title="Coverage Areas">
            <ul className="list-disc list-inside space-y-1 text-hud-text/80">
              <li>
                <strong>World News:</strong> Breaking news, diplomatic events,
                humanitarian updates from global agencies
              </li>
              <li>
                <strong>Finance &amp; Markets:</strong> Cryptocurrencies, stock
                indices, commodities, macroeconomic indicators
              </li>
              <li>
                <strong>Technology:</strong> Cybersecurity advisories, software
                vulnerabilities, tech industry updates
              </li>
              <li>
                <strong>Weather &amp; Environment:</strong> Natural disaster
                alerts, seismic activity, climate data, energy grid status
              </li>
              <li>
                <strong>Health:</strong> Disease outbreak tracking, WHO
                bulletins, public health alerts
              </li>
              <li>
                <strong>Sports:</strong> Live scores across football, basketball,
                F1, cricket, and more
              </li>
            </ul>
          </Section>

          <Section title="Platform Features">
            <ul className="list-disc list-inside space-y-1 text-hud-text/80">
              <li>Interactive 2D and 3D map with multiple visualization modes</li>
              <li>AI-powered news summaries and trend detection</li>
              <li>Real-time event streaming with category filtering</li>
              <li>232 live international news channels from public sources</li>
              <li>10 specialized dashboard views (Finance, Weather, Sports, etc.)</li>
              <li>20 customizable visual themes</li>
              <li>Text-to-speech for hands-free news reading</li>
              <li>Available in 30 languages</li>
            </ul>
          </Section>

          <Section title="Pricing">
            <p>
              The WorldScope dashboard is <strong>free</strong> and supported
              by advertising. Every dashboard feature — live news feeds,
              interactive maps, news channels, AI analytics, data export,
              daily email briefings, and more — is available at no cost with
              no account required. An optional <strong>Gaia subscription</strong>{" "}
              ($9/month or $90/year) unlocks the weekly Sunday Convergence
              Report PDF, personalized country-level briefings, and an
              ad-free mode. See our{" "}
              <Link href="/pricing" className="text-hud-accent hover:underline">
                Pricing page
              </Link>{" "}
              for the full feature list.
            </p>
          </Section>

          <Section title="Data Sources">
            <p>
              WorldScope aggregates content exclusively from publicly available
              sources: official government data feeds, licensed news agency RSS
              feeds, public financial market APIs, weather service APIs, and
              other open data providers. We do not create or editorialize news
              content — we organize and present information from established
              sources.
            </p>
          </Section>

          <Section title="Editorial Methodology">
            <p className="mb-3">
              WorldScope follows a rigorous methodology for information
              aggregation and presentation:
            </p>
            <ul className="list-disc list-inside space-y-1 text-hud-text/80">
              <li>
                <strong>Source Verification:</strong> Every data source is
                vetted before inclusion. We only aggregate from established news
                agencies, official government feeds, and licensed API providers.
              </li>
              <li>
                <strong>Multi-Source Corroboration:</strong> Our AI convergence
                engine cross-references events across multiple independent
                sources to identify corroborated information and flag potential
                misinformation.
              </li>
              <li>
                <strong>Severity Classification:</strong> Events are classified
                using a five-level severity scale (critical, high, medium, low,
                info) based on impact scope, affected population, and urgency.
              </li>
              <li>
                <strong>Attribution:</strong> All aggregated content is
                attributed to its original source. We do not alter, editorialize,
                or misrepresent source material.
              </li>
              <li>
                <strong>Transparency:</strong> Our data pipeline, source list,
                and processing methodology are documented. Users can inspect the
                original source for any event displayed on the platform.
              </li>
            </ul>
          </Section>

          <Section title="Technology and Infrastructure">
            <p>
              WorldScope is built using modern, open-source web technologies.
              The platform runs on a cloud-native architecture designed for
              reliability, performance, and global availability. Our
              infrastructure includes distributed caching, edge deployment
              across multiple regions, and automated failover systems. The
              entire platform is designed to maintain sub-second response times
              even during high-traffic events and breaking news situations.
            </p>
          </Section>

          <Section title="Independence">
            <p>
              WorldScope is an independent project operated by Azad Uluyazi. It
              is not affiliated with, sponsored by, or endorsed by any
              government, military, or political organization. All data comes
              from publicly available APIs, RSS feeds, and open data sources.
              Our editorial decisions are made independently, and our advertising
              partnerships do not influence content selection or presentation.
            </p>
          </Section>

          <Section title="Advertising and Sustainability">
            <p>
              WorldScope is entirely funded through non-intrusive advertising
              via Google AdSense. We believe in providing free access to global
              news monitoring while maintaining a sustainable business model.
              Advertisements are clearly distinguished from editorial content
              and never influence our data aggregation, source selection, or
              event classification. See our{" "}
              <Link href="/disclaimer" className="text-hud-accent hover:underline">
                Disclaimer
              </Link>{" "}
              for details.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              For questions, feedback, or business inquiries:{" "}
              <a
                href="mailto:info@troiamedia.com"
                className="text-hud-accent hover:underline"
              >
                info@troiamedia.com
              </a>
              . Visit our{" "}
              <Link href="/contact" className="text-hud-accent hover:underline">
                Contact page
              </Link>{" "}
              for specific inquiry types and FAQ.
            </p>
          </Section>
        </div>

        <LegalFooter />

        <AdSenseUnit
          slot={AD_PLACEMENTS.analytics[0].slot!}
          format={AD_PLACEMENTS.analytics[0].format as "horizontal"}
          className="mt-4"
        />
      </div>

      <AdConsentBanner />
      <NewsletterPopup />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-hud-border rounded-sm p-4">
      <h2 className="text-sm font-bold text-hud-accent mb-2 tracking-wide uppercase">
        {title}
      </h2>
      <div className="text-hud-text/80">{children}</div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-hud-border/50 rounded-sm p-3 text-center">
      <div className="text-lg font-bold text-hud-accent">{value}</div>
      <div className="text-[10px] text-hud-muted uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
