import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/shared/LegalFooter";
import { PricingTierCard } from "@/components/pricing/PricingTierCard";
import { describeTier, type TierSlug } from "@/lib/subscriptions/tier-config";

// Force per-request render. `describeTier()` reads
// NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_GAIA* env vars at call time; those
// decide whether SubscribeButton shows "SUBSCRIBE" or "COMING SOON".
// A static build inlines whatever the env held at build-time, so a
// page built before Lemon variants were configured would serve
// "COMING SOON" forever even after env was set + redeployed if the
// CDN edge still held the old chunk. force-dynamic sidesteps that.
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

/** Compute monthly + annual tier descriptors server-side so the client
 *  card just reads them — avoids env var reads on the browser. */
function tierCycles(slug: TierSlug) {
  const monthly = describeTier(slug, "monthly");
  const annualDesc = describeTier(slug, "annual");
  return {
    monthly,
    annual: annualDesc.purchasable ? annualDesc : null,
  };
}

function Persona({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="border border-gray-800 rounded-sm p-3 bg-[#0a0810]">
      <div className="font-mono text-[11px] text-amber-300 mb-1">{label}</div>
      <p className="text-[11px] text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

export default function PricingPage() {
  const gaiaCycles = tierCycles("gaia");

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
          <PricingTierCard
            slug="gaia"
            name="Gaia"
            greek="Γαῖα — the Earth"
            tag="Single Tier"
            lede="One price, every feature. Personalized country briefings in your inbox, the Sunday Convergence Report, WorldScope Chat, Equity Research, custom alerts — all unlocked at the same tier. No plan comparison matrix. No decision fatigue."
            bullets={[
              "Daily + weekly intelligence briefings for up to 15 countries you pick",
              "Quiet hours — pause delivery while you sleep, in your timezone",
              "Priority data refresh (60s) vs free tier's 10 min",
              "Weekly Sunday Convergence Report (AI-curated PDF)",
              "WorldScope Chat — multi-turn, grounded in the live feed",
              "Equity Research across 92 exchanges (Finnhub)",
              "Bookmarks + persistent saved events across devices",
              "Custom alert rules with quiet hours & multi-channel delivery",
              "MCP connector for Claude / GPT / custom LLMs",
              "Ad-free dashboard experience",
              "Priority support via email",
            ]}
            monthly={gaiaCycles.monthly}
            annual={gaiaCycles.annual}
          />
          <p className="text-[11px] text-gray-500 mt-4 text-center leading-relaxed">
            Need more than the 15-country cap, a custom delivery
            frequency, API access, or a team / enterprise plan?{" "}
            <a
              href="mailto:info@troiamedia.com?subject=Custom%20Gaia%20coverage"
              className="text-amber-300 hover:underline"
            >
              info@troiamedia.com
            </a>{" "}
            — we reply within 2 business days with options and a quote.
          </p>
        </div>

        {/* ── Built for people who need fast signal ── */}
        <div className="mb-10">
          <h2 className="text-sm font-bold text-amber-300 tracking-wider uppercase mb-4">
            Built for people who need fast signal
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Persona
              label="Investors & portfolio managers"
              desc="Track global equities, analyst targets, and macro indicators alongside the geopolitical risk signals that move them."
            />
            <Persona
              label="Energy & commodity traders"
              desc="Shipping movement, cargo inference, supply-chain disruption, and the geopolitical triggers that show up in futures first."
            />
            <Persona
              label="Researchers & analysts"
              desc="Equity research, economic analytics, and geopolitical frameworks for deeper analysis and reporting."
            />
            <Persona
              label="Journalists & media"
              desc="Follow fast-moving developments across markets and regions without manually stitching sources yourself."
            />
            <Persona
              label="Government & institutions"
              desc="Macro-policy tracking, central-bank monitoring, and situational awareness over geopolitical and infrastructure signals."
            />
            <Persona
              label="Anyone watching Türkiye + region"
              desc="Pick Türkiye plus up to 14 neighbors, allies, or energy partners. Daily or weekly brief. No fluff, no ads, no headline-spam."
            />
          </div>
        </div>

        {/* ── Why Gaia vs the obvious alternative ── */}
        <div className="mb-10 border border-amber-400/30 rounded-sm p-5 bg-amber-400/[0.02]">
          <h2 className="text-sm font-bold text-amber-300 tracking-wider uppercase mb-3">
            Why Gaia at $9 beats the $39 tier elsewhere
          </h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <strong className="text-amber-200">4× cheaper</strong> — the
              nearest comparable platform charges $39.99/mo. Same live data
              categories (689 sources, 195 countries).
            </li>
            <li>
              <strong className="text-amber-200">Country-personal</strong> —
              pick 1–15 specific countries; get a brief written just for
              those. Competitors send one global digest to everyone.
            </li>
            <li>
              <strong className="text-amber-200">
                Turkish-first editorial
              </strong>{" "}
              — Türk, Arap, İran, İsrail kaynakları yerinde ağırlıkta.
              Western-only feeds&apos;in göremediği şeyleri görürsün.
            </li>
            <li>
              <strong className="text-amber-200">
                Annual save — 2 months free
              </strong>{" "}
              — $90/year vs $108 monthly-billed.
            </li>
            <li>
              <strong className="text-amber-200">
                No paywall for the dashboard
              </strong>{" "}
              — the 3D globe + news feed + maps stay free with ads. Gaia
              unlocks personalization + emails + ad-free mode.
            </li>
          </ul>
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
              a="Yes. The entire WorldScope dashboard — maps, news feeds, IPTV channels, AI analytics, daily newsletter — is free and ad-supported. Gaia ($9/month or $90/year) is the one optional paid tier that unlocks the Sunday Convergence Report PDF, personalized country-level briefings, ad-free mode, and priority tooling. Every current dashboard feature will always remain free."
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

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div>
      <p className="font-bold text-gray-200">{q}</p>
      <p>{a}</p>
    </div>
  );
}
