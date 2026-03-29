import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/shared/LegalFooter";

export const metadata: Metadata = {
  title: "Contact — WorldScope",
  description:
    "Get in touch with the WorldScope team for support, feedback, or advertising inquiries.",
  openGraph: {
    title: "Contact — WorldScope",
    description:
      "Contact WorldScope for support, feedback, or advertising inquiries.",
    type: "website",
  },
};

export default function ContactPage() {
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
          Contact
        </h1>
        <p className="text-hud-muted text-xs mb-8">
          Get in touch with the WorldScope team
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-hud-text/90">
          <div className="border border-hud-border rounded-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-sm bg-hud-accent/10 border border-hud-accent/30 flex items-center justify-center text-hud-accent text-base">
                @
              </div>
              <div>
                <h2 className="text-sm font-bold text-hud-accent tracking-wide uppercase">
                  Email
                </h2>
                <a
                  href="mailto:info@troiamedia.com"
                  className="text-hud-text hover:text-hud-accent transition-colors"
                >
                  info@troiamedia.com
                </a>
              </div>
            </div>
            <p className="text-hud-text/70 text-xs">
              Primary contact for all inquiries. We aim to respond within 48
              hours.
            </p>
          </div>

          <div className="border border-hud-border rounded-sm p-4">
            <h2 className="text-sm font-bold text-hud-accent mb-3 tracking-wide uppercase">
              What can we help with?
            </h2>
            <div className="space-y-3">
              <ContactItem
                label="General Support"
                desc="Questions about using WorldScope, reporting issues, or requesting features."
              />
              <ContactItem
                label="Feedback"
                desc="Suggestions for improving the platform, data sources, or user experience."
              />
              <ContactItem
                label="Advertising"
                desc="Inquiries about advertising on WorldScope or partnership opportunities."
              />
              <ContactItem
                label="Data &amp; API"
                desc="Questions about our data sources, API access, or data accuracy."
              />
              <ContactItem
                label="Privacy &amp; Legal"
                desc="GDPR requests, data deletion, or legal inquiries."
              />
            </div>
          </div>

          <div className="border border-hud-border rounded-sm p-4">
            <h2 className="text-sm font-bold text-hud-accent mb-2 tracking-wide uppercase">
              Newsletter Support
            </h2>
            <p className="text-hud-text/80">
              Premium mail subscribers can manage their subscription or
              unsubscribe at any time through the link provided in each briefing
              email. For billing questions, contact us at the email above.
            </p>
          </div>
        </div>

        <LegalFooter />
      </div>
    </div>
  );
}

function ContactItem({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-hud-accent text-[10px] mt-1">&#9654;</span>
      <div>
        <span className="text-hud-text font-medium">{label}</span>
        <span className="text-hud-muted"> — {desc}</span>
      </div>
    </div>
  );
}
