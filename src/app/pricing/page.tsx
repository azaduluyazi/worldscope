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

        <h1 className="text-xl font-bold text-amber-300 mb-1 tracking-wider uppercase">
          Gaia — one tier, everything unlocked
        </h1>
        <p className="text-gray-500 text-xs mb-8">
          WorldScope runs on a single subscription. One price covers every
          premium feature we ship today and every one we ship next.
        </p>

        <div className="max-w-xl mx-auto mb-8">
          <Tier
            slug="gaia"
            name="Gaia"
            greek="Γαῖα — the Earth"
            price="$9"
            unit="everything / month"
            tag="Single Tier"
            lede="One price, every feature. Personalized country briefings in your inbox, the Sunday Convergence Report, WorldScope Chat, Equity Research, custom alerts — all unlocked at the same tier. No plan comparison matrix. No decision fatigue."
            bullets={[
              "Daily + weekly intelligence briefings for up to 15 countries you pick",
              "Weekly Sunday Convergence Report (AI-curated PDF)",
              "WorldScope Chat — multi-turn, grounded in the live feed",
              "Equity Research across 92 exchanges (Finnhub)",
              "Bookmarks + persistent saved events across devices",
              "Custom alert rules with quiet hours & multi-channel delivery",
              "MCP connector for Claude / GPT / custom LLMs",
              "Ad-free dashboard experience",
              "Priority support via email",
            ]}
          />
          <p className="text-[11px] text-gray-500 mt-4 text-center">
            Teams &amp; enterprise: contact{" "}
            <a
              href="mailto:info@troiamedia.com"
              className="text-amber-300 hover:underline"
            >
              info@troiamedia.com
            </a>{" "}
            for seat-based pricing and SSO.
          </p>
        </div>

        {/* Public dashboard footnote — no more "Free Core" framing. The
            dashboard stays ad-supported; Gaia is the only subscription. */}
        <div className="border border-gray-800 rounded-sm p-4 mb-8 text-xs text-gray-500">
          <p>
            The public dashboard at{" "}
            <Link href="/" className="text-gray-300 hover:text-amber-300">
              troiamedia.com
            </Link>{" "}
            remains ad-supported and open to everyone. Gaia is the only paid
            subscription — it removes ads and unlocks the features above.
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
