import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/shared/LegalFooter";

export const metadata: Metadata = {
  title: "Cookie Policy — WorldScope",
  description:
    "Cookie policy for WorldScope (troiamedia.com). Learn about the cookies we use, why we use them, and how to manage your preferences.",
  openGraph: {
    title: "Cookie Policy — WorldScope",
    description:
      "Learn about the cookies used on WorldScope and how to manage your preferences.",
    type: "website",
  },
  alternates: { canonical: "/cookies" },
};

export default function CookiePolicyPage() {
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
          Cookie Policy
        </h1>
        <p className="text-hud-muted text-xs mb-8">
          Last updated: April 2026
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-hud-text/90">
          <Section title="What Are Cookies?">
            <p>
              Cookies are small text files placed on your device when you visit a
              website. They help websites remember your preferences, understand
              how you interact with the site, and serve relevant content. Cookies
              may be set by the site you are visiting (&quot;first-party
              cookies&quot;) or by third-party services operating on that site.
            </p>
          </Section>

          <Section title="How WorldScope Uses Cookies">
            <p className="mb-3">
              WorldScope (troiamedia.com) uses cookies for the following
              purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-hud-text/80">
              <li>
                <strong>Essential Cookies:</strong> Required for core site
                functionality including theme preferences, language selection,
                dashboard layout settings, and consent management. These cannot
                be disabled as they are necessary for the platform to function.
              </li>
              <li>
                <strong>Analytics Cookies:</strong> We use Vercel Analytics and
                Sentry to understand how visitors use WorldScope, identify
                errors, and improve performance. These cookies collect anonymous
                usage data such as pages visited, time spent, and browser type.
              </li>
              <li>
                <strong>Advertising Cookies:</strong> Google AdSense sets
                cookies to serve relevant advertisements based on your browsing
                behavior. These cookies help fund WorldScope as a free platform
                and may track your activity across websites to deliver
                personalized ads.
              </li>
              <li>
                <strong>Functional Cookies:</strong> Used to remember your
                preferences such as selected theme, language, bookmarked events,
                and map view settings. These enhance your experience but are not
                strictly necessary.
              </li>
            </ul>
          </Section>

          <Section title="Third-Party Cookies">
            <p className="mb-3">
              The following third-party services may set cookies on your device
              when you use WorldScope:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-hud-border text-left">
                    <th className="pb-2 text-hud-accent">Service</th>
                    <th className="pb-2 text-hud-accent">Purpose</th>
                    <th className="pb-2 text-hud-accent">Type</th>
                  </tr>
                </thead>
                <tbody className="text-hud-text/80">
                  <tr className="border-b border-hud-border/30">
                    <td className="py-2">Google AdSense</td>
                    <td>Advertising &amp; revenue</td>
                    <td>Third-party</td>
                  </tr>
                  <tr className="border-b border-hud-border/30">
                    <td className="py-2">Vercel Analytics</td>
                    <td>Performance monitoring</td>
                    <td>Third-party</td>
                  </tr>
                  <tr className="border-b border-hud-border/30">
                    <td className="py-2">Sentry</td>
                    <td>Error tracking</td>
                    <td>Third-party</td>
                  </tr>
                  <tr className="border-b border-hud-border/30">
                    <td className="py-2">Mapbox</td>
                    <td>Interactive maps</td>
                    <td>Third-party</td>
                  </tr>
                  <tr className="border-b border-hud-border/30">
                    <td className="py-2">Supabase</td>
                    <td>Authentication &amp; data</td>
                    <td>Third-party</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Managing Your Cookie Preferences">
            <p className="mb-3">
              You have several options to control cookies:
            </p>
            <ul className="list-disc list-inside space-y-2 text-hud-text/80">
              <li>
                <strong>Consent Banner:</strong> When you first visit
                WorldScope, a consent banner allows you to accept or decline
                non-essential cookies. You can change your preference at any
                time.
              </li>
              <li>
                <strong>Browser Settings:</strong> Most browsers allow you to
                block or delete cookies through their settings. Note that
                blocking essential cookies may impair site functionality.
              </li>
              <li>
                <strong>Google Ad Settings:</strong> Visit{" "}
                <a
                  href="https://adssettings.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-hud-accent hover:underline"
                >
                  Google Ad Settings
                </a>{" "}
                to manage how Google uses cookies for advertising.
              </li>
              <li>
                <strong>Opt-Out Tools:</strong> The{" "}
                <a
                  href="https://optout.networkadvertising.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-hud-accent hover:underline"
                >
                  Network Advertising Initiative
                </a>{" "}
                provides an opt-out tool for many ad networks.
              </li>
            </ul>
          </Section>

          <Section title="Cookie Retention">
            <p>
              Essential and functional cookies are retained for up to 12 months.
              Analytics cookies are retained for up to 26 months. Advertising
              cookies are managed by their respective third-party providers and
              follow their own retention policies. Session cookies are deleted
              when you close your browser.
            </p>
          </Section>

          <Section title="Updates to This Policy">
            <p>
              We may update this Cookie Policy to reflect changes in our
              practices or legal requirements. The &quot;Last updated&quot; date
              at the top of this page indicates when the policy was last revised.
              Continued use of WorldScope after changes constitutes acceptance of
              the updated policy.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              For questions about our use of cookies, contact us at{" "}
              <a
                href="mailto:info@troiamedia.com"
                className="text-hud-accent hover:underline"
              >
                info@troiamedia.com
              </a>{" "}
              or visit our{" "}
              <Link href="/privacy" className="text-hud-accent hover:underline">
                Privacy Policy
              </Link>
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
