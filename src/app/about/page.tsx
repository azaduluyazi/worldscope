import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — WorldScope",
  description:
    "WorldScope is a real-time global intelligence monitoring platform aggregating 2000+ sources, 37 live feeds, and 232 TV channels across 30 languages.",
  openGraph: {
    title: "About — WorldScope",
    description:
      "Real-time global intelligence monitoring platform. 2000+ sources, 30 languages, free to use.",
    type: "website",
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
          Real-Time Global Intelligence Monitoring
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-hud-text/90">
          <Section title="Mission">
            <p>
              WorldScope exists to democratize access to global intelligence.
              We aggregate, process, and present real-time data from thousands
              of sources worldwide — making critical information accessible to
              everyone, not just institutions with expensive data terminals.
            </p>
          </Section>

          <Section title="What We Monitor">
            <div className="grid grid-cols-2 gap-3 mt-2">
              <StatBlock label="Data Sources" value="2,000+" />
              <StatBlock label="Live Feeds" value="37" />
              <StatBlock label="TV Channels" value="232" />
              <StatBlock label="RSS Feeds" value="549" />
              <StatBlock label="Languages" value="30" />
              <StatBlock label="API Clients" value="137" />
            </div>
          </Section>

          <Section title="Coverage">
            <ul className="list-disc list-inside space-y-1 text-hud-text/80">
              <li>
                <strong>Geopolitics &amp; Conflict:</strong> Armed conflicts,
                diplomatic events, threat assessments, rocket alerts
              </li>
              <li>
                <strong>Finance &amp; Markets:</strong> Crypto, indices,
                commodities, macro economics, prediction markets
              </li>
              <li>
                <strong>Technology:</strong> Cybersecurity threats, CVEs,
                ransomware tracking, tech industry news
              </li>
              <li>
                <strong>Weather &amp; Environment:</strong> Natural disasters,
                seismic activity, climate data, energy grids
              </li>
              <li>
                <strong>Health:</strong> Disease outbreaks, WHO alerts, radiation
                monitoring
              </li>
              <li>
                <strong>Sports:</strong> Live scores across football, basketball,
                F1, cricket, and more
              </li>
            </ul>
          </Section>

          <Section title="Platform Features">
            <ul className="list-disc list-inside space-y-1 text-hud-text/80">
              <li>Interactive 2D and 3D globe with multiple visualization modes</li>
              <li>AI-powered intelligence summaries and anomaly detection</li>
              <li>Real-time event streaming with severity classification</li>
              <li>232 live TV channels from global broadcasters</li>
              <li>10 specialized dashboard variants (Finance, Conflict, Cyber, etc.)</li>
              <li>20 customizable HUD themes</li>
              <li>Text-to-speech for hands-free intelligence briefings</li>
            </ul>
          </Section>

          <Section title="Pricing">
            <p className="mb-2">
              WorldScope is <strong>free to use</strong> and supported by
              advertising. All core features — live feeds, maps, TV channels,
              and AI analysis — are available at no cost.
            </p>
            <p>
              A <strong>premium mail subscription</strong> is available for
              $1/month, delivering daily AI-curated intelligence briefings to
              your inbox. Cancel anytime.
            </p>
          </Section>

          <Section title="Independence">
            <p>
              WorldScope is an independent project. We are not affiliated with,
              sponsored by, or endorsed by any government, military, intelligence
              agency, or political organization. Our data comes exclusively from
              publicly available APIs, RSS feeds, and open-source intelligence
              (OSINT) sources.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              For questions, feedback, or advertising inquiries:{" "}
              <a
                href="mailto:noreply@troiamedia.com"
                className="text-hud-accent hover:underline"
              >
                noreply@troiamedia.com
              </a>
            </p>
          </Section>
        </div>

        <Footer />
      </div>
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

function Footer() {
  return (
    <div className="mt-10 pt-4 border-t border-hud-border text-xs text-hud-muted flex flex-wrap gap-4">
      <Link href="/" className="hover:text-hud-accent transition-colors">
        Dashboard
      </Link>
      <Link href="/privacy" className="hover:text-hud-accent transition-colors">
        Privacy
      </Link>
      <Link href="/terms" className="hover:text-hud-accent transition-colors">
        Terms
      </Link>
      <Link href="/contact" className="hover:text-hud-accent transition-colors">
        Contact
      </Link>
    </div>
  );
}
