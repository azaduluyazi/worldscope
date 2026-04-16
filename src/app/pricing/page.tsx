import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/shared/LegalFooter";

export const metadata: Metadata = {
  title: "Pricing — WorldScope",
  description:
    "WorldScope core platform is 100% free. Real-time global news dashboard with AI analytics, interactive maps, live international news channels, and more. Optional premium briefing tier coming soon.",
  openGraph: {
    title: "Pricing — WorldScope",
    description:
      "Free core platform. Real-time global news monitoring with AI analytics, 3D maps, live international news channels, and 20+ themes. Premium briefing tier coming soon.",
    type: "website",
  },
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#050a12] text-gray-200 p-6 font-mono" lang="en">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-cyan-400 transition-colors mb-6"
        >
          &larr; Back to Dashboard
        </Link>

        <h1 className="text-xl font-bold text-cyan-400 mb-1 tracking-wider uppercase">
          Free Core, Optional Premium
        </h1>
        <p className="text-gray-500 text-xs mb-8">
          Full dashboard free forever. Optional paid briefing tier launching soon.
        </p>

        {/* Hero card */}
        <div className="border-2 border-cyan-400/30 rounded-sm p-6 mb-8 bg-cyan-400/5">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-4xl font-bold text-cyan-400">$0</span>
            <span className="text-sm text-gray-500">forever</span>
          </div>
          <p className="text-sm text-gray-300 mb-6">
            WorldScope is a free, ad-supported global intelligence platform.
            Every feature is included — no account required, no credit card, no limits.
          </p>

          <ul className="space-y-3 text-sm text-gray-200">
            <Feature text="Real-time global news dashboard" />
            <Feature text="Interactive 2D & 3D world maps" />
            <Feature text="232 live international news channels" />
            <Feature text="549 RSS feed sources" />
            <Feature text="10 dashboard variants (Finance, Weather, Sports...)" />
            <Feature text="News translation in 30 languages" />
            <Feature text="AI-powered analytics & trend detection" />
            <Feature text="Daily email briefing (newsletter)" />
            <Feature text="Text-to-speech news reader" />
            <Feature text="20+ visual themes" />
            <Feature text="5 globe visualization modes" />
            <Feature text="Data export (CSV)" />
          </ul>
        </div>

        {/* How we stay free */}
        <div className="border border-gray-800 rounded-sm p-4 mb-8">
          <h2 className="text-sm font-bold text-cyan-400 mb-3 tracking-wide uppercase">
            How We Stay Free
          </h2>
          <p className="text-sm text-gray-400">
            The WorldScope core dashboard is supported by non-intrusive
            advertising. We use ads to cover our infrastructure costs so that
            every dashboard feature remains free for everyone — no feature
            gates, no account walls.
          </p>
        </div>

        {/* Premium Briefing — Coming Soon */}
        <div className="border-2 border-amber-400/40 rounded-sm p-6 mb-8 bg-amber-400/5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-sm tracking-wider uppercase">
              Coming Soon
            </span>
            <h2 className="text-sm font-bold text-amber-300 tracking-wide uppercase">
              Premium Intelligence Briefing
            </h2>
          </div>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-amber-300">$1</span>
            <span className="text-xs text-gray-500">
              per country / month — optional add-on
            </span>
          </div>
          <p className="text-sm text-gray-300 mb-4">
            An optional paid email briefing tier sitting on top of the free
            dashboard. Subscribe for just <strong>$1</strong> and select the
            country or countries you want to follow — receive a personalized
            daily situation report generated from our full aggregation network.
          </p>
          <ul className="space-y-2 text-sm text-gray-200 mb-4">
            <Feature text="Personalized daily email — one or more countries" />
            <Feature text="AI-generated situation reports from 2,000+ sources" />
            <Feature text="Priority delivery ahead of the free newsletter" />
            <Feature text="Cancel anytime — no long-term commitment" />
          </ul>
          <p className="text-[11px] text-gray-500">
            A higher <strong>$5</strong> tier with expanded regional coverage
            and deeper analytics is planned for a later release. The core
            WorldScope dashboard will always remain free.
          </p>
        </div>

        {/* Newsletter signup */}
        <div className="border border-gray-800 rounded-sm p-6 mb-8 bg-cyan-400/5">
          <h2 className="text-sm font-bold text-cyan-400 mb-2 tracking-wide uppercase">
            Stay Informed
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Get a free daily briefing delivered to your inbox — AI-generated
            situation reports covering the most important global events.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-3 py-2 bg-[#0a1628] border border-gray-700 rounded-sm text-sm text-gray-200 placeholder:text-gray-600 focus:border-cyan-400 focus:outline-none"
            />
            <Link
              href="/"
              className="px-4 py-2 bg-cyan-400 text-[#050a12] text-sm font-bold rounded-sm hover:bg-cyan-300 transition-colors whitespace-nowrap"
            >
              Subscribe Free
            </Link>
          </div>
          <p className="text-[10px] text-gray-600 mt-2">
            No spam. Unsubscribe anytime. We never share your email.
          </p>
        </div>

        {/* FAQ */}
        <div className="border border-gray-800 rounded-sm p-4">
          <h2 className="text-sm font-bold text-cyan-400 mb-3 tracking-wide uppercase">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4 text-sm text-gray-400">
            <FaqItem
              q="What is WorldScope?"
              a="WorldScope is a real-time global news monitoring platform. It aggregates data from 2,000+ sources, provides interactive maps, live international news channels, AI-powered analytics, and customizable dashboards — all in your browser."
            />
            <FaqItem
              q="Is WorldScope really free?"
              a="Yes. The entire WorldScope dashboard — maps, news feeds, channels, AI analytics, daily newsletter — is free and ad-supported. We are preparing to launch an optional paid premium briefing add-on ($1/country) for users who want personalized email intelligence reports, but every current dashboard feature will always remain free."
            />
            <FaqItem
              q="Do I need an account?"
              a="No. WorldScope is fully accessible without registration. You can optionally sign up for a free daily email briefing."
            />
            <FaqItem
              q="What data sources does WorldScope use?"
              a="We aggregate content from 2,000+ publicly available sources including government data feeds, news agency RSS feeds, financial market APIs, weather services, and other open data providers."
            />
            <FaqItem
              q="Is WorldScope a software product?"
              a="Yes. WorldScope is a web-based software platform that you access through your browser. There is nothing to download or install."
            />
            <FaqItem
              q="How do I get the daily email briefing?"
              a={<>Enter your email above or visit the dashboard and use the newsletter signup. The briefing is free and you can unsubscribe anytime. Contact us at{" "}<a href="mailto:info@troiamedia.com" className="text-cyan-400 hover:underline">info@troiamedia.com</a> for any questions.</>}
            />
          </div>
        </div>

        <LegalFooter />
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 text-cyan-400">&#10003;</span>
      <span>{text}</span>
    </li>
  );
}

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div>
      <p className="font-bold text-gray-200">{q}</p>
      <p>{a}</p>
    </div>
  );
}
