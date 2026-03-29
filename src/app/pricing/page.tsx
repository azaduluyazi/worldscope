import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/shared/LegalFooter";

export const metadata: Metadata = {
  title: "Pricing — WorldScope",
  description:
    "WorldScope is free to use. Optional premium email subscription for $1/month with daily AI-curated news briefings.",
  openGraph: {
    title: "Pricing — WorldScope",
    description:
      "Free global news dashboard. Premium email briefings for $1/month.",
    type: "website",
  },
};

export default function PricingPage() {
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
          Pricing
        </h1>
        <p className="text-hud-muted text-xs mb-8">
          Simple, transparent pricing
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-hud-text/90">
          {/* Free Tier */}
          <div className="border-2 border-hud-border rounded-sm p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-bold text-hud-accent tracking-wide uppercase">
                Free
              </h2>
              <span className="text-2xl font-bold text-hud-accent">$0</span>
            </div>
            <p className="text-hud-text/80 mb-4">
              Full access to the WorldScope dashboard — no account required,
              no credit card needed.
            </p>
            <ul className="space-y-2 text-hud-text/80">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">&#10003;</span>
                Real-time global news feed from 2,000+ sources
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">&#10003;</span>
                Interactive 2D &amp; 3D world map with event markers
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">&#10003;</span>
                232 live TV channels from global broadcasters
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">&#10003;</span>
                Finance, weather, health, sports, and technology dashboards
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">&#10003;</span>
                AI-powered news summaries and trend analysis
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">&#10003;</span>
                Text-to-speech news reading in 30 languages
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">&#10003;</span>
                20 customizable visual themes
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">&#10003;</span>
                Translation to 30 languages
              </li>
            </ul>
            <p className="mt-4 text-[10px] text-hud-muted">
              Supported by non-intrusive advertising (Google AdSense).
            </p>
          </div>

          {/* Premium Tier */}
          <div className="border-2 border-hud-accent/50 rounded-sm p-6 bg-hud-accent/5">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-hud-accent tracking-wide uppercase">
                  Premium Email
                </h2>
                <span className="text-[10px] text-hud-muted uppercase tracking-wider">
                  Optional Subscription
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-hud-accent">$1</span>
                <span className="text-xs text-hud-muted">/month</span>
              </div>
            </div>
            <p className="text-hud-text/80 mb-4">
              Daily AI-curated news briefings delivered straight to your inbox.
              Everything in Free, plus:
            </p>
            <ul className="space-y-2 text-hud-text/80">
              <li className="flex items-start gap-2">
                <span className="text-hud-accent mt-0.5">&#9889;</span>
                Daily AI situation briefing email
              </li>
              <li className="flex items-start gap-2">
                <span className="text-hud-accent mt-0.5">&#9889;</span>
                Instant breaking news critical alerts
              </li>
              <li className="flex items-start gap-2">
                <span className="text-hud-accent mt-0.5">&#9889;</span>
                Weekly trend analysis report
              </li>
              <li className="flex items-start gap-2">
                <span className="text-hud-accent mt-0.5">&#9889;</span>
                Weekly geopolitical analysis digest
              </li>
            </ul>
            <div className="mt-6 p-3 border border-hud-border rounded-sm bg-hud-surface/50">
              <p className="text-[10px] text-hud-muted leading-relaxed">
                <strong className="text-hud-text">Payment:</strong> Processed securely by{" "}
                <a
                  href="https://paddle.com"
                  className="text-hud-accent hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Paddle.com
                </a>{" "}
                (Merchant of Record). Paddle handles billing, invoicing, VAT/sales tax,
                and payment processing.
                <br />
                <strong className="text-hud-text">Cancel anytime:</strong> No questions asked.
                Cancel through the link in any email or contact us.
                <br />
                <strong className="text-hud-text">Refunds:</strong> See our{" "}
                <Link href="/refund" className="text-hud-accent hover:underline">
                  Refund Policy
                </Link>
                . 7-day money-back guarantee on first payment.
              </p>
            </div>
          </div>

          {/* FAQ */}
          <div className="border border-hud-border rounded-sm p-4">
            <h2 className="text-sm font-bold text-hud-accent mb-3 tracking-wide uppercase">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4 text-hud-text/80">
              <div>
                <p className="font-bold text-hud-text">Do I need an account to use WorldScope?</p>
                <p>No. The dashboard is fully accessible without registration or login.</p>
              </div>
              <div>
                <p className="font-bold text-hud-text">What do I get with the premium subscription?</p>
                <p>
                  You receive a daily email with an AI-generated summary of the most important
                  global news, plus instant alerts for critical breaking events and weekly analysis reports.
                </p>
              </div>
              <div>
                <p className="font-bold text-hud-text">How do I cancel?</p>
                <p>
                  Click the unsubscribe/manage link in any email we send, or email us at{" "}
                  <a href="mailto:info@troiamedia.com" className="text-hud-accent hover:underline">
                    info@troiamedia.com
                  </a>
                  . Cancellation is instant, no questions asked.
                </p>
              </div>
              <div>
                <p className="font-bold text-hud-text">Can I get a refund?</p>
                <p>
                  Yes. We offer a 7-day money-back guarantee on your first payment. See our{" "}
                  <Link href="/refund" className="text-hud-accent hover:underline">
                    Refund Policy
                  </Link>{" "}
                  for full details.
                </p>
              </div>
              <div>
                <p className="font-bold text-hud-text">Who processes payments?</p>
                <p>
                  All payments are handled by{" "}
                  <a
                    href="https://paddle.com"
                    className="text-hud-accent hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Paddle.com
                  </a>
                  , our Merchant of Record. Paddle manages billing, tax compliance, and refunds.
                </p>
              </div>
            </div>
          </div>
        </div>

        <LegalFooter />
      </div>
    </div>
  );
}
