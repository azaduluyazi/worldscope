import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/shared/LegalFooter";

export const metadata: Metadata = {
  title: "Pricing — WorldScope",
  description:
    "WorldScope pricing plans. Free dashboard access or upgrade to Pro for advanced analytics, AI reports, custom alerts, and ad-free experience.",
  openGraph: {
    title: "Pricing — WorldScope",
    description:
      "Free global news dashboard. Pro plan with advanced features for $1/month.",
    type: "website",
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-hud-base text-hud-text p-6 font-mono">
      <div className="max-w-4xl mx-auto">
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
          Choose the plan that fits your needs
        </p>

        {/* Plan comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Free Plan */}
          <div className="border border-hud-border rounded-sm p-6">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-lg font-bold text-hud-text tracking-wide uppercase">
                Free
              </h2>
              <span className="text-2xl font-bold text-hud-text">$0</span>
            </div>
            <p className="text-hud-muted text-xs mb-6">
              Full access to core platform features. No account required.
            </p>

            <ul className="space-y-2.5 text-sm text-hud-text/80">
              <Feature text="Real-time global news dashboard" />
              <Feature text="Interactive 2D & 3D world map" />
              <Feature text="232 live TV channels" />
              <Feature text="549 RSS feed sources" />
              <Feature text="10 dashboard variants (Finance, Weather, Sports...)" />
              <Feature text="News translation in 30 languages" />
              <Feature text="Text-to-speech news reader" />
              <Feature text="20 visual themes" />
              <Feature text="Standard data refresh rate" />
              <Feature text="Ad-supported" disabled />
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="border-2 border-hud-accent/50 rounded-sm p-6 bg-hud-accent/5 relative">
            <div className="absolute -top-3 right-4 bg-hud-accent text-hud-base text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
              Recommended
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-lg font-bold text-hud-accent tracking-wide uppercase">
                Pro
              </h2>
              <div className="text-right">
                <span className="text-2xl font-bold text-hud-accent">$1</span>
                <span className="text-xs text-hud-muted">/month</span>
              </div>
            </div>
            <p className="text-hud-muted text-xs mb-6">
              Everything in Free, plus advanced analytics and premium features.
            </p>

            <ul className="space-y-2.5 text-sm text-hud-text/80">
              <Feature text="Everything in Free plan" accent />
              <Feature text="Ad-free dashboard experience" accent />
              <Feature text="Daily AI-generated situation report (email)" accent />
              <Feature text="Instant critical breaking news alerts (email)" accent />
              <Feature text="Weekly trend analysis &amp; digest (email)" accent />
              <Feature text="Priority data refresh rate" accent />
              <Feature text="Advanced AI-powered analytics" accent />
              <Feature text="Custom notification preferences" accent />
              <Feature text="Data export (CSV)" accent />
              <Feature text="Early access to new features" accent />
            </ul>

            <div className="mt-6 p-3 border border-hud-border rounded-sm bg-hud-surface/50 text-[10px] text-hud-muted leading-relaxed">
              Cancel anytime — no questions asked. 7-day money-back guarantee.
            </div>
          </div>
        </div>

        {/* Feature comparison table */}
        <div className="border border-hud-border rounded-sm p-4 mb-8">
          <h2 className="text-sm font-bold text-hud-accent mb-4 tracking-wide uppercase">
            Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-hud-border">
                  <th className="text-left py-2 text-hud-muted font-normal">Feature</th>
                  <th className="text-center py-2 text-hud-muted font-normal w-24">Free</th>
                  <th className="text-center py-2 text-hud-accent font-bold w-24">Pro</th>
                </tr>
              </thead>
              <tbody className="text-hud-text/80">
                <CompRow feature="Live news dashboard" free="✓" pro="✓" />
                <CompRow feature="Interactive maps (2D + 3D)" free="✓" pro="✓" />
                <CompRow feature="232 live TV channels" free="✓" pro="✓" />
                <CompRow feature="30-language translation" free="✓" pro="✓" />
                <CompRow feature="Text-to-speech" free="✓" pro="✓" />
                <CompRow feature="Visual themes" free="20" pro="20" />
                <CompRow feature="Dashboard variants" free="10" pro="10" />
                <CompRow feature="Ad-free experience" free="✗" pro="✓" />
                <CompRow feature="Daily AI situation report" free="✗" pro="✓" />
                <CompRow feature="Breaking news email alerts" free="✗" pro="✓" />
                <CompRow feature="Weekly trend digest" free="✗" pro="✓" />
                <CompRow feature="Priority data refresh" free="✗" pro="✓" />
                <CompRow feature="Advanced AI analytics" free="✗" pro="✓" />
                <CompRow feature="Data export (CSV)" free="✗" pro="✓" />
                <CompRow feature="Custom notifications" free="✗" pro="✓" />
                <CompRow feature="Early access to features" free="✗" pro="✓" />
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment & Billing */}
        <div className="border border-hud-border rounded-sm p-4 mb-8">
          <h2 className="text-sm font-bold text-hud-accent mb-3 tracking-wide uppercase">
            Payment &amp; Billing
          </h2>
          <div className="space-y-2 text-sm text-hud-text/80">
            <p>
              All payments are securely processed by{" "}
              <a
                href="https://paddle.com"
                className="text-hud-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Paddle.com
              </a>
              , our Merchant of Record. Paddle handles billing, invoicing,
              VAT/sales tax calculation, and payment processing worldwide.
            </p>
            <p>
              Accepted payment methods include credit/debit cards, PayPal, Apple Pay,
              Google Pay, and wire transfer (depending on your region).
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="border border-hud-border rounded-sm p-4">
          <h2 className="text-sm font-bold text-hud-accent mb-3 tracking-wide uppercase">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4 text-sm text-hud-text/80">
            <FaqItem
              q="What is WorldScope?"
              a="WorldScope is a real-time global news monitoring software platform. It aggregates data from 2,000+ sources, provides interactive maps, live TV, AI-powered analytics, and customizable dashboards — all in your browser."
            />
            <FaqItem
              q="Do I need an account to use WorldScope?"
              a="No. The Free plan is fully accessible without registration. You only need an account if you upgrade to Pro."
            />
            <FaqItem
              q="What do I get with the Pro plan?"
              a="Pro unlocks ad-free browsing, advanced AI analytics, daily email situation reports, breaking news alerts, weekly digests, priority data refresh, data export, and early access to new features."
            />
            <FaqItem
              q="How do I cancel my Pro subscription?"
              a={<>Manage or cancel your subscription anytime via the Paddle customer portal link in your confirmation email, or contact us at{" "}<a href="mailto:info@troiamedia.com" className="text-hud-accent hover:underline">info@troiamedia.com</a>. Cancellation is instant, no questions asked.</>}
            />
            <FaqItem
              q="Can I get a refund?"
              a={<>Yes. We offer a 7-day money-back guarantee on your first payment. See our{" "}<Link href="/refund" className="text-hud-accent hover:underline">Refund Policy</Link> for full details.</>}
            />
            <FaqItem
              q="Who processes payments?"
              a={<>All payments are handled by{" "}<a href="https://paddle.com" className="text-hud-accent hover:underline" target="_blank" rel="noopener noreferrer">Paddle.com</a>, our Merchant of Record. Paddle manages billing, tax compliance, invoicing, and refunds on our behalf.</>}
            />
            <FaqItem
              q="Is WorldScope a software product?"
              a="Yes. WorldScope is a web-based software platform (SaaS) that you access through your browser. There is nothing to download or install. The Pro plan is a software subscription that unlocks additional platform features."
            />
          </div>
        </div>

        <LegalFooter />
      </div>
    </div>
  );
}

function Feature({ text, accent, disabled }: { text: string; accent?: boolean; disabled?: boolean }) {
  return (
    <li className="flex items-start gap-2">
      <span className={`mt-0.5 ${disabled ? "text-hud-muted/40" : accent ? "text-hud-accent" : "text-green-400"}`}>
        {disabled ? "✗" : "✓"}
      </span>
      <span className={disabled ? "text-hud-muted/40 line-through" : ""}>{text}</span>
    </li>
  );
}

function CompRow({ feature, free, pro }: { feature: string; free: string; pro: string }) {
  return (
    <tr className="border-b border-hud-border/30">
      <td className="py-1.5">{feature}</td>
      <td className="text-center py-1.5">{free === "✗" ? <span className="text-hud-muted/40">{free}</span> : free}</td>
      <td className="text-center py-1.5 text-hud-accent">{pro}</td>
    </tr>
  );
}

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div>
      <p className="font-bold text-hud-text">{q}</p>
      <p>{a}</p>
    </div>
  );
}
