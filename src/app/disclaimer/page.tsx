import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/shared/LegalFooter";

export const metadata: Metadata = {
  title: "Disclaimer — WorldScope",
  description:
    "Legal disclaimer for WorldScope (troiamedia.com). Important information about the limitations of our global news monitoring platform.",
  openGraph: {
    title: "Disclaimer — WorldScope",
    description:
      "Legal disclaimer and limitations of liability for the WorldScope platform.",
    type: "website",
  },
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
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
          Disclaimer
        </h1>
        <p className="text-hud-muted text-xs mb-8">
          Last updated: April 2026
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-hud-text/90">
          <Section title="General Information">
            <p>
              WorldScope (troiamedia.com) is a real-time global news monitoring
              and intelligence aggregation platform operated by Azad Uluyazi
              (trading as Troia Media), based in Istanbul, Turkey. The
              information provided on this platform is for general informational
              and educational purposes only. It should not be construed as
              professional advice of any kind.
            </p>
          </Section>

          <Section title="No Investment or Financial Advice">
            <p>
              The financial data, market information, cryptocurrency prices,
              commodity rates, and economic indicators displayed on WorldScope
              are aggregated from public third-party sources and are provided
              strictly for informational purposes. Nothing on this platform
              constitutes financial, investment, trading, or tax advice. You
              should consult a qualified financial advisor before making any
              investment decisions. WorldScope and Troia Media are not registered
              as financial advisors, brokers, or dealers in any jurisdiction.
            </p>
          </Section>

          <Section title="Accuracy of Information">
            <p>
              While WorldScope strives to present accurate and timely
              information, we aggregate content from over 2,000 third-party
              sources including news agencies, government feeds, and public APIs.
              We cannot guarantee the accuracy, completeness, reliability, or
              timeliness of any information displayed. Data may be delayed,
              incorrect, or incomplete due to source limitations, network
              issues, or processing delays. Users should independently verify
              critical information before relying on it.
            </p>
          </Section>

          <Section title="AI-Generated Content">
            <p>
              WorldScope uses artificial intelligence (AI) models to generate
              news summaries, trend analyses, convergence reports, and
              intelligence briefings. AI-generated content may contain
              inaccuracies, misinterpretations, or biases. Such content is
              provided as a supplementary tool and should not be treated as
              authoritative reporting. Users are encouraged to consult original
              sources for verification.
            </p>
          </Section>

          <Section title="Third-Party Content and Links">
            <p>
              WorldScope aggregates content from third-party sources and may
              display links to external websites. We do not control, endorse, or
              assume responsibility for the content, privacy policies, or
              practices of any third-party sites. Inclusion of external content
              or links does not imply endorsement. Users access third-party
              content at their own risk.
            </p>
          </Section>

          <Section title="No Medical Advice">
            <p>
              Health-related information displayed on WorldScope, including
              disease outbreak data, WHO bulletins, and public health alerts, is
              sourced from public health organizations and news agencies. This
              information is not a substitute for professional medical advice,
              diagnosis, or treatment. Always seek the advice of qualified
              health providers with questions regarding medical conditions.
            </p>
          </Section>

          <Section title="Not a Government Source">
            <p>
              WorldScope is an independent, private platform. It is not
              affiliated with, sponsored by, or endorsed by any government,
              military, intelligence agency, or political organization. Content
              related to conflicts, geopolitics, or government actions is
              aggregated from publicly available sources and does not represent
              official government positions or classified information.
            </p>
          </Section>

          <Section title="Limitation of Liability">
            <p>
              To the maximum extent permitted by applicable law, WorldScope,
              Troia Media, and Azad Uluyazi shall not be liable for any direct,
              indirect, incidental, consequential, or punitive damages arising
              from your use of or inability to use the platform, reliance on
              any information provided, or any errors, omissions, or
              interruptions in the service. Use of WorldScope is entirely at
              your own risk.
            </p>
          </Section>

          <Section title="Advertising Disclaimer">
            <p>
              WorldScope is a free platform supported by advertising revenue
              through Google AdSense and other advertising partners.
              Advertisements displayed on the platform are served by third-party
              ad networks and do not constitute endorsement by WorldScope or
              Troia Media. We are not responsible for the content, accuracy, or
              practices of advertisers.
            </p>
          </Section>

          <Section title="Changes to This Disclaimer">
            <p>
              We reserve the right to modify this disclaimer at any time without
              prior notice. Changes take effect immediately upon posting.
              Continued use of WorldScope after modifications constitutes
              acceptance of the updated disclaimer. For questions, contact{" "}
              <a
                href="mailto:info@troiamedia.com"
                className="text-hud-accent hover:underline"
              >
                info@troiamedia.com
              </a>
              .
            </p>
          </Section>
        </div>

        <LegalFooter />
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
