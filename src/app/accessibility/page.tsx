import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/shared/LegalFooter";

export const metadata: Metadata = {
  title: "Accessibility — WorldScope",
  description:
    "WorldScope accessibility statement. Our commitment to making global news monitoring accessible to everyone.",
  openGraph: {
    title: "Accessibility — WorldScope",
    description:
      "Our commitment to making global news monitoring accessible to everyone.",
    type: "website",
  },
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
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
          Accessibility Statement
        </h1>
        <p className="text-hud-muted text-xs mb-8">
          Last updated: April 2026
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-hud-text/90">
          <Section title="Our Commitment">
            <p>
              WorldScope (troiamedia.com) is committed to ensuring digital
              accessibility for people of all abilities. We continuously work to
              improve the user experience for everyone and apply relevant
              accessibility standards throughout our platform. Access to global
              news and information should not be limited by disability or
              assistive technology requirements.
            </p>
          </Section>

          <Section title="Accessibility Features">
            <p className="mb-3">
              WorldScope includes the following accessibility features:
            </p>
            <ul className="list-disc list-inside space-y-2 text-hud-text/80">
              <li>
                <strong>Keyboard Navigation:</strong> All interactive elements
                are accessible via keyboard. Tab navigation follows a logical
                order through dashboard panels, controls, and content areas.
              </li>
              <li>
                <strong>Screen Reader Support:</strong> Semantic HTML elements,
                ARIA labels, and descriptive alt text are used throughout the
                interface to support screen readers and assistive technologies.
              </li>
              <li>
                <strong>Text-to-Speech:</strong> Built-in text-to-speech
                functionality allows users to listen to news articles and
                intelligence briefings hands-free, supporting multiple languages.
              </li>
              <li>
                <strong>High Contrast Themes:</strong> Multiple visual themes
                are available including high-contrast options. Users can switch
                themes via the settings panel to find the most readable option.
              </li>
              <li>
                <strong>Responsive Design:</strong> The platform adapts to
                various screen sizes and orientations, supporting desktop,
                tablet, and mobile devices.
              </li>
              <li>
                <strong>Multilingual Support:</strong> Content is available in
                30 languages, with automatic language detection and manual
                language switching.
              </li>
              <li>
                <strong>Reduced Motion:</strong> We respect the
                &quot;prefers-reduced-motion&quot; system preference to minimize
                animations for users who experience motion sensitivity.
              </li>
              <li>
                <strong>Focus Indicators:</strong> Visible focus indicators are
                provided for keyboard users to identify the currently focused
                element.
              </li>
            </ul>
          </Section>

          <Section title="Standards">
            <p>
              We aim to conform to the Web Content Accessibility Guidelines
              (WCAG) 2.1 Level AA standards. These guidelines explain how to
              make web content more accessible for people with disabilities. We
              continue to review and improve our platform to meet and exceed
              these standards. Our development process includes accessibility
              testing as part of our quality assurance workflow.
            </p>
          </Section>

          <Section title="Known Limitations">
            <p className="mb-3">
              While we strive for full accessibility, some areas of WorldScope
              may have limitations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-hud-text/80">
              <li>
                <strong>Interactive Maps:</strong> The Mapbox-powered map
                component may have limited screen reader support for geographic
                visualizations. We provide alternative text-based views for map
                data where possible.
              </li>
              <li>
                <strong>Live TV Streams:</strong> Third-party TV channel embeds
                may not fully support accessibility features. Closed captions
                depend on the original broadcaster.
              </li>
              <li>
                <strong>Real-Time Updates:</strong> Live-updating content such
                as market tickers and event feeds may be challenging for screen
                readers. We are working on ARIA live regions to improve this.
              </li>
              <li>
                <strong>Third-Party Content:</strong> Advertisements and
                embedded content from third-party providers may not fully meet
                our accessibility standards.
              </li>
            </ul>
          </Section>

          <Section title="Feedback and Assistance">
            <p>
              We welcome your feedback on the accessibility of WorldScope. If
              you encounter accessibility barriers, have suggestions for
              improvement, or need assistance accessing any content, please
              contact us:
            </p>
            <div className="mt-3 space-y-1">
              <p>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:info@troiamedia.com"
                  className="text-hud-accent hover:underline"
                >
                  info@troiamedia.com
                </a>
              </p>
              <p>
                <strong>Subject Line:</strong> Accessibility Feedback
              </p>
              <p>
                <strong>Response Time:</strong> We aim to respond to
                accessibility feedback within 5 business days.
              </p>
            </div>
          </Section>

          <Section title="Continuous Improvement">
            <p>
              Accessibility is an ongoing effort. We regularly audit our
              platform, train our development team on accessibility best
              practices, and incorporate user feedback into our improvement
              roadmap. We are committed to providing an inclusive experience for
              all users of WorldScope.
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
