import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/shared/LegalFooter";
import { SubscribeButton } from "@/components/pricing/SubscribeButton";
import { describeTier, type TierSlug } from "@/lib/subscriptions/tier-config";

export const metadata: Metadata = {
  title: "Pricing — WorldScope",
  description:
    "WorldScope core platform is 100% free. Real-time global news dashboard with AI analytics, interactive maps, 8,246 live international news channels, and more. Optional paid briefing tiers launching soon.",
  openGraph: {
    title: "Pricing — WorldScope",
    description:
      "Free core platform. Real-time global news monitoring with AI analytics, 3D maps, 8,246 live international news channels, and 30 languages. Paid briefing tiers launching soon.",
    type: "website",
  },
  alternates: { canonical: "/pricing" },
};

interface TierProps {
  /** Used as the element id so /pricing#<slug> can deep-link here.
   *  Must match the tier slugs in lib/subscriptions/tier-config.ts
   *  (pleiades, gaia, prometheus, pantheon). */
  slug: TierSlug;
  name: string;
  greek: string;
  price: string;
  unit: string;
  tag: string;
  lede: string;
  bullets: string[];
}

function Tier({ slug, name, greek, price, unit, tag, lede, bullets }: TierProps) {
  const { purchasable } = describeTier(slug);
  const effectiveTag = purchasable ? "Available" : tag;

  return (
    <div
      id={slug}
      className="border border-amber-400/40 rounded-sm p-5 bg-amber-400/[0.03] scroll-mt-24 flex flex-col"
    >
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-[10px] font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-sm tracking-wider uppercase">
          {effectiveTag}
        </span>
        <h3 className="text-base font-bold text-amber-300 tracking-wide uppercase">
          {name} <span className="text-amber-200/60 font-normal">· {greek}</span>
        </h3>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-amber-300">{price}</span>
        <span className="text-xs text-gray-500">{unit}</span>
      </div>
      <p className="text-sm text-gray-300 mb-3">{lede}</p>
      <ul className="space-y-2 text-sm text-gray-200 mb-4 flex-1">
        {bullets.map((b) => (
          <Feature key={b} text={b} />
        ))}
      </ul>
      <SubscribeButton
        slug={slug}
        purchasable={purchasable}
        label={`SUBSCRIBE · ${name.toUpperCase()}`}
        className="mt-auto"
      />
    </div>
  );
}

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
          Free Core · Pantheon of Premium
        </h1>
        <p className="text-gray-500 text-xs mb-8">
          The full dashboard is free forever. Optional paid briefing tiers —
          named after the Greek pantheon — are launching in phases.
        </p>

        {/* Hero card — Free */}
        <div className="border-2 border-cyan-400/30 rounded-sm p-6 mb-8 bg-cyan-400/5">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-4xl font-bold text-cyan-400">$0</span>
            <span className="text-sm text-gray-500">forever — no sign-up</span>
          </div>
          <p className="text-sm text-gray-300 mb-6">
            WorldScope is a free, ad-supported global intelligence platform.
            Every feature is included — no account required, no credit card, no
            limits.
          </p>

          <ul className="space-y-3 text-sm text-gray-200">
            <Feature text="Real-time global news dashboard" />
            <Feature text="Interactive 2D & 3D world maps" />
            <Feature text="8,246 live IPTV channels + 106 YouTube news streams" />
            <Feature text="689 curated RSS feed sources" />
            <Feature text="11 dashboard variants (Olympus, Ares, Hephaestus, Hermes…)" />
            <Feature text="30 languages + full RTL support (Arabic, Persian)" />
            <Feature text="AI-powered analytics, convergence engine & trend detection" />
            <Feature text="Text-to-speech news reader" />
            <Feature text="2 curated visual themes — Troia War Room & Neon Cyberpunk" />
            <Feature text="Programmatic country pages — 195 countries × 9 variants" />
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

        {/* Pantheon of tiers — Greek pantheon */}
        <h2 className="text-sm font-bold text-amber-300 mb-4 tracking-wide uppercase">
          Pantheon of Premium Briefings
        </h2>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Tier
            slug="pleiades"
            name="Pleiades"
            greek="Πλειάδες — seven sisters"
            price="$5"
            unit="5 countries / month"
            tag="Planned"
            lede="A curated bundle of five countries of your choosing — built for regional analysts tracking an arc of conflict, trade, or markets."
            bullets={[
              "5 countries, one subscription",
              "Daily cross-country convergence briefing",
              "Regional scoring — early signals across the set",
              "Full AI summarization",
            ]}
          />
          <Tier
            slug="gaia"
            name="Gaia"
            greek="Γαῖα — the Earth"
            price="$9"
            unit="global / month"
            tag="Planned"
            lede="The entire planet in one briefing. Gaia delivers a daily worldwide digest: tier-1 events, convergence storylines, and macro signals."
            bullets={[
              "Every country, every day",
              "Convergence T1–T4 storyline feed",
              "Weekly macro digest",
              "Priority delivery",
            ]}
          />
          <Tier
            slug="prometheus"
            name="Prometheus"
            greek="Προμηθεύς — the fire bringer"
            price="$19"
            unit="pro / month"
            tag="Planned"
            lede="Power-user toolkit — WorldScope Chat, MCP connector for Claude/GPT, alert rules engine, custom widgets, and AI digest delivery to Slack, Telegram, email, and webhooks."
            bullets={[
              "Everything in Gaia",
              "WorldScope Chat (multi-turn, 30 languages)",
              "MCP connector (bring-your-own LLM)",
              "Custom alert rules with quiet hours",
              "Slack / Telegram / Webhook digest delivery",
            ]}
          />
        </div>

        <div
          id="pantheon"
          className="border border-gray-800 rounded-sm p-5 mb-8 bg-purple-400/5 scroll-mt-24"
        >
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-bold text-purple-300 bg-purple-400/20 px-2 py-0.5 rounded-sm tracking-wider uppercase">
              Enterprise
            </span>
            <h3 className="text-base font-bold text-purple-300 tracking-wide uppercase">
              Pantheon <span className="text-purple-200/60 font-normal">· Πάνθεον — council of the gods</span>
            </h3>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-purple-300">$99</span>
            <span className="text-xs text-gray-500">team / month</span>
          </div>
          <p className="text-sm text-gray-300 mb-2">
            Team tier — up to 5 seats, shared watchlists, SSO, private MCP
            servers, priority support. Designed for newsrooms, intelligence
            desks, and trading teams.
          </p>
          <p className="text-[11px] text-gray-500">
            Contact <a href="mailto:info@troiamedia.com" className="text-purple-300 hover:underline">info@troiamedia.com</a> to be notified at launch.
          </p>
        </div>

        {/* Gaia launch CTA — replaces the legacy free email capture.
            Free newsletter sign-up has been paused while Gaia ($9/mo) goes
            through merchant-of-record review. See
            wiki/sorunlar/briefing-free-signup-still-open.md. */}
        <div className="border border-amber-400/40 rounded-sm p-6 mb-8 bg-amber-400/5 scroll-mt-24" id="briefing">
          <h2 className="text-sm font-bold text-amber-400 mb-2 tracking-wide uppercase">
            The Sunday Convergence Report
          </h2>
          <p className="text-sm text-gray-300 mb-4">
            One AI-curated PDF every Sunday at 07:00 UTC — moving to the Gaia
            tier. Create an account now so you&apos;re one click away from
            enrolling when the tier opens.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Link
              href="/sign-up?redirect_url=/briefing"
              className="px-4 py-2 bg-amber-400 text-[#060509] text-sm font-bold rounded-sm hover:bg-amber-300 transition-colors whitespace-nowrap"
            >
              Create Account
            </Link>
            <Link
              href="#gaia"
              className="px-4 py-2 border border-amber-400/50 text-amber-300 text-sm font-bold rounded-sm hover:bg-amber-400/10 transition-colors whitespace-nowrap"
            >
              See Gaia →
            </Link>
          </div>
          <p className="text-[10px] text-gray-600 mt-2">
            Existing subscribers: your Sunday delivery continues uninterrupted.
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
              a="WorldScope is a real-time global news monitoring platform. It aggregates data from 2,000+ sources, provides interactive maps, 8,246 live IPTV channels, AI-powered analytics, and customizable dashboards — all in your browser."
            />
            <FaqItem
              q="Is WorldScope really free?"
              a="Yes. The entire WorldScope dashboard — maps, news feeds, IPTV channels, AI analytics, daily newsletter — is free and ad-supported. Optional paid briefing tiers (Chora, Pleiades, Gaia, Prometheus, Pantheon) are launching in phases for users who want personalized or power-user features. Every current dashboard feature will always remain free."
            />
            <FaqItem
              q="Why are the tiers named after Greek mythology?"
              a="WorldScope's 11 dashboard variants (Olympus, Ares, Hephaestus, Hermes, Athena, Poseidon, Apollo, Zeus, Demeter, Nike, Eirene) are each named after a deity whose domain matches the focus — war, markets, cyber, weather. The paid tiers extend that theme: Chora (a single land), Pleiades (seven sisters — a bundle), Gaia (the Earth — global), Prometheus (bringer of fire and knowledge — pro tools), and Pantheon (the council of gods — team)."
            />
            <FaqItem
              q="Do I need an account?"
              a="No. WorldScope is fully accessible without registration. You can optionally sign up for a free daily email briefing or a paid tier."
            />
            <FaqItem
              q="How is payment processed?"
              a="Paid tiers are handled through a global merchant of record, which means the processor — not WorldScope — is the seller of record and is responsible for regional sales tax, VAT, and chargeback handling."
            />
            <FaqItem
              q="What data sources does WorldScope use?"
              a="We aggregate content from 2,000+ publicly available sources including government data feeds, 689 news agency RSS feeds, 171 financial and geopolitical APIs, weather services, and other open data providers."
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
