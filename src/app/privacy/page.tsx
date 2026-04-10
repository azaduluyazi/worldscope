import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/shared/LegalFooter";

export const metadata: Metadata = {
  title: "Privacy Policy — WorldScope",
  description:
    "WorldScope privacy policy. Learn how we collect, use, and protect your data on our global news monitoring platform.",
  openGraph: {
    title: "Privacy Policy — WorldScope",
    description:
      "WorldScope privacy policy. Learn how we collect, use, and protect your data.",
    type: "website",
  },
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-hud-muted text-xs mb-8">
          Last updated: March 2026
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-hud-text/90">
          <Section title="1. Introduction">
            WorldScope (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates
            the global news monitoring platform at troiamedia.com. This
            Privacy Policy explains how we collect, use, and protect information
            when you use our service. By accessing WorldScope, you agree to this
            policy.
          </Section>

          <Section title="2. Information We Collect">
            <p className="mb-2">
              WorldScope does not require account creation or login to use the
              platform. We collect minimal data:
            </p>
            <ul className="list-disc list-inside space-y-1 text-hud-text/80">
              <li>
                <strong>Usage analytics:</strong> Anonymous page views, session
                duration, and feature usage via standard web analytics.
              </li>
              <li>
                <strong>Cookies:</strong> Essential cookies for theme
                preferences, language selection, and session management.
                Third-party cookies may be set by advertising partners.
              </li>
              <li>
                <strong>Newsletter subscription:</strong> If you opt in to the
                daily briefing, we collect your email address to deliver the
                newsletter. No payment information is collected.
              </li>
              <li>
                <strong>Device information:</strong> Browser type, operating
                system, and screen resolution for performance optimization.
              </li>
            </ul>
          </Section>

          <Section title="3. Third-Party Services">
            <p className="mb-2">
              WorldScope integrates the following third-party services, each with
              their own privacy policies:
            </p>
            <ul className="list-disc list-inside space-y-1 text-hud-text/80">
              <li>
                <strong>Google AdSense:</strong> Displays advertisements. Google
                may use cookies to serve ads based on prior visits. See{" "}
                <ExtLink href="https://policies.google.com/privacy">
                  Google&apos;s Privacy Policy
                </ExtLink>
                .
              </li>
              <li>
                <strong>Supabase:</strong> Database and infrastructure services.
              </li>
              <li>
                <strong>Mapbox:</strong> Map rendering and geospatial data
                display.
              </li>
              <li>
                <strong>Resend:</strong> Email delivery for daily newsletter
                briefings.
              </li>
              <li>
                <strong>Sentry:</strong> Error tracking and performance
                monitoring (anonymized).
              </li>
              <li>
                <strong>Vercel:</strong> Hosting and edge network delivery.
              </li>
            </ul>
          </Section>

          <Section title="4. Cookies">
            <p>
              We use cookies for essential site functionality (theme, language
              preferences) and to support advertising through Google AdSense.
              Advertising cookies help serve relevant ads and measure campaign
              effectiveness. You can control cookie settings through your browser
              preferences. Disabling cookies may affect site functionality.
            </p>
          </Section>

          <Section title="5. How We Use Your Information">
            <ul className="list-disc list-inside space-y-1 text-hud-text/80">
              <li>To provide and maintain the WorldScope platform</li>
              <li>To deliver free daily newsletter briefings to subscribers</li>
              <li>To improve platform performance and user experience</li>
              <li>To display relevant advertisements via Google AdSense</li>
              <li>To detect and prevent abuse or technical issues</li>
            </ul>
          </Section>

          <Section title="6. Data Sharing">
            <p>
              We do not sell your personal data. We share information only with
              the third-party service providers listed above, and only as
              necessary to operate the platform. We may disclose information if
              required by law or to protect our legal rights.
            </p>
          </Section>

          <Section title="7. Data Retention">
            <p>
              Analytics data is retained in aggregated, anonymized form.
              Newsletter subscriber data is retained until you unsubscribe. You
              may request deletion of your email data at any time by contacting
              us.
            </p>
          </Section>

          <Section title="8. Your Rights (GDPR)">
            <p>
              If you are in the European Economic Area, you have the right to
              access, correct, delete, or port your personal data. You may also
              object to processing or withdraw consent at any time. To exercise
              these rights, contact us at the address below. We will respond
              within 30 days.
            </p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              WorldScope is not directed at children under 13. We do not
              knowingly collect personal information from children. If you
              believe a child has provided us with personal data, please contact
              us.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Changes will
              be posted on this page with an updated revision date. Continued use
              of the platform after changes constitutes acceptance.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              For privacy-related inquiries, contact us at:{" "}
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

function ExtLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-hud-accent hover:underline"
    >
      {children}
    </a>
  );
}
