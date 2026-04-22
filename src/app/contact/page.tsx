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
  alternates: { canonical: "/contact" },
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
              Newsletter subscribers can manage their subscription or
              unsubscribe at any time through the link provided in each briefing
              email. For questions, contact us at the email above.
            </p>
          </div>

          <div className="border border-hud-border rounded-sm p-4">
            <h2 className="text-sm font-bold text-hud-accent mb-3 tracking-wide uppercase">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <FaqItem
                q="Is WorldScope free to use?"
                a="Yes, the WorldScope dashboard is free. All dashboard features — live news feeds, interactive maps, news channels, AI analytics, and daily email briefings — are available at no cost with no account required. The platform is supported by advertising. An optional Gaia subscription ($9/month or $90/year) unlocks the weekly Sunday Convergence Report PDF, personalized country-level briefings, and an ad-free mode."
              />
              <FaqItem
                q="Where does WorldScope get its data?"
                a="We aggregate content from over 2,000 publicly available sources including official news agencies (Reuters, AP, AFP), government data feeds, financial market APIs (CoinGecko, Yahoo Finance), weather services (USGS, NWS), and public health organizations (WHO, CDC). All data comes from licensed RSS feeds and open APIs."
              />
              <FaqItem
                q="How often is the data updated?"
                a="Most data sources are polled every 5 minutes. Financial market data updates in near real-time. Weather and seismic data is updated as new observations are published. Our AI-powered convergence engine continuously analyzes incoming data to detect emerging stories."
              />
              <FaqItem
                q="Can I use WorldScope data for research or journalism?"
                a="WorldScope is an aggregation and monitoring tool. You are free to use the platform for research, journalism, or education. However, the underlying content comes from third-party sources — please cite original sources when publishing. See our Terms of Service for details."
              />
              <FaqItem
                q="How do I report incorrect information?"
                a="If you notice inaccurate data or content, please email us at info@troiamedia.com with the specific page URL and a description of the issue. We review all reports and work to correct errors promptly."
              />
              <FaqItem
                q="Is my data safe on WorldScope?"
                a="WorldScope does not require registration or personal data to use. For newsletter subscribers, we collect only email addresses. We use industry-standard encryption and do not sell personal data. See our Privacy Policy for full details."
              />
              <FaqItem
                q="What languages does WorldScope support?"
                a="The interface is available in 30 languages. News content is displayed in its original language with source attribution. Our AI can generate summaries in English and Turkish."
              />
            </div>
          </div>

          <div className="border border-hud-border rounded-sm p-4">
            <h2 className="text-sm font-bold text-hud-accent mb-2 tracking-wide uppercase">
              Business Address
            </h2>
            <div className="text-hud-text/80 space-y-1">
              <p><strong>Troia Media</strong></p>
              <p>Operated by Azad Uluyazi</p>
              <p>Istanbul, Turkey</p>
              <p>
                Email:{" "}
                <a href="mailto:info@troiamedia.com" className="text-hud-accent hover:underline">
                  info@troiamedia.com
                </a>
              </p>
            </div>
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

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <h3 className="text-hud-text font-medium text-sm">{q}</h3>
      <p className="text-hud-text/70 text-xs mt-1 leading-relaxed">{a}</p>
    </div>
  );
}
