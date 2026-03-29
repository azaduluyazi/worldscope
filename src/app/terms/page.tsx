import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/shared/LegalFooter";

export const metadata: Metadata = {
  title: "Terms of Service — WorldScope",
  description:
    "Terms of Service for WorldScope, a real-time global news monitoring platform at troiamedia.com.",
  openGraph: {
    title: "Terms of Service — WorldScope",
    description:
      "Terms of Service for the WorldScope global news monitoring platform.",
    type: "website",
  },
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-hud-muted text-xs mb-8">
          Last updated: March 2026
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-hud-text/90">
          <Section title="1. Acceptance of Terms">
            By accessing or using WorldScope at troiamedia.com
            (&quot;the Service&quot;), you agree to be bound by these Terms of
            Service. If you do not agree to these terms, do not use the Service.
          </Section>

          <Section title="2. Description of Service">
            WorldScope is a real-time global news monitoring platform
            that aggregates publicly available data from news agencies, APIs, RSS feeds, and
            open data sources. The Service is provided free of charge with
            optional premium features.
          </Section>

          <Section title="3. Use of Service">
            <ul className="list-disc list-inside space-y-1 text-hud-text/80">
              <li>The Service is free to use and does not require account creation.</li>
              <li>
                You may use the Service for personal, educational, or
                professional purposes.
              </li>
              <li>
                You may not use automated tools to scrape, mirror, or reproduce
                the Service without permission.
              </li>
              <li>
                You may not attempt to disrupt, overload, or compromise the
                Service infrastructure.
              </li>
            </ul>
          </Section>

          <Section title="4. Data Sources &amp; Accuracy">
            <p>
              WorldScope aggregates data from third-party public sources
              including government agencies, news organizations, financial data
              providers, and open APIs. We do not guarantee the accuracy,
              completeness, or timeliness of any data displayed on the platform.
              All data is provided &quot;as is&quot; and should not be used as the sole
              basis for critical decisions. Always verify important information
              through official sources.
            </p>
          </Section>

          <Section title="5. Pro Subscription">
            <ul className="list-disc list-inside space-y-1 text-hud-text/80">
              <li>
                The WorldScope Pro plan is a software subscription available for
                $1.00 USD per month.
              </li>
              <li>
                Pro unlocks premium platform features including ad-free
                experience, advanced AI analytics, priority data refresh, data
                export, custom notifications, and email-delivered situation
                reports and alerts.
              </li>
              <li>
                Payment is processed securely through Paddle, our authorized
                Merchant of Record.
              </li>
              <li>
                You may cancel your subscription at any time through Paddle. No
                refunds are provided for partial billing periods.
              </li>
              <li>
                You can manage your subscription via the Paddle customer portal
                or by contacting us.
              </li>
            </ul>
          </Section>

          <Section title="6. Advertising">
            <p>
              The Service is supported by advertising, including ads served by
              Google AdSense and other advertising partners. Ad content is
              provided by third parties and does not represent endorsement by
              WorldScope.
            </p>
          </Section>

          <Section title="7. Intellectual Property">
            <p>
              The WorldScope platform design, code, branding, and original
              content are the property of Troia Media. Third-party data
              displayed on the platform remains the intellectual property of its
              respective owners and is used under their terms of service. You may
              not reproduce, distribute, or create derivative works based on the
              platform without permission.
            </p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>
              The Service is provided &quot;as is&quot; and &quot;as
              available&quot; without warranties of any kind, express or implied.
              WorldScope and its operators shall not be liable for any direct,
              indirect, incidental, consequential, or punitive damages arising
              from your use of the Service, including but not limited to
              decisions made based on data displayed on the platform.
            </p>
          </Section>

          <Section title="9. Service Availability">
            <p>
              We strive to maintain continuous availability but do not guarantee
              uninterrupted access. The Service may be temporarily unavailable
              due to maintenance, updates, or circumstances beyond our control.
              We reserve the right to modify, suspend, or discontinue any part of
              the Service at any time without notice.
            </p>
          </Section>

          <Section title="10. Privacy">
            <p>
              Your use of the Service is also governed by our{" "}
              <Link
                href="/privacy"
                className="text-hud-accent hover:underline"
              >
                Privacy Policy
              </Link>
              , which describes how we collect and use your information.
            </p>
          </Section>

          <Section title="11. Changes to Terms">
            <p>
              We reserve the right to update these Terms of Service at any time.
              Changes will be posted on this page with an updated revision date.
              Continued use of the Service after changes constitutes acceptance
              of the revised terms.
            </p>
          </Section>

          <Section title="12. Governing Law">
            <p>
              These terms shall be governed by and construed in accordance with
              applicable laws. Any disputes arising from the use of the Service
              shall be resolved through good-faith negotiation before pursuing
              legal remedies.
            </p>
          </Section>

          <Section title="13. Contact">
            <p>
              For questions about these Terms of Service, contact us at:{" "}
              <a
                href="mailto:info@troiamedia.com"
                className="text-hud-accent hover:underline"
              >
                info@troiamedia.com
              </a>
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
