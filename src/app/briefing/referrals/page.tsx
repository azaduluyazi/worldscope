import type { Metadata } from "next";
import Link from "next/link";
import { ReferralDashboard } from "@/components/newsletter/ReferralDashboard";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://troiamedia.com";

export const metadata: Metadata = {
  title:
    "Your Referral Dashboard — The Sunday Convergence Report | TroiaMedia",
  description:
    "See your referral link, track your rank, and unlock tiered rewards for inviting friends to The Sunday Convergence Report.",
  alternates: { canonical: `${SITE_URL}/briefing/referrals` },
  robots: { index: true, follow: true },
};

export default function ReferralsPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Briefing", url: `${SITE_URL}/briefing` },
          { name: "Referrals", url: `${SITE_URL}/briefing/referrals` },
        ]}
      />
      <main className="min-h-screen bg-hud-base text-hud-text overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
          <div className="font-mono text-[10px] text-hud-accent uppercase tracking-[0.2em] mb-2">
            SUNDAY CONVERGENCE REPORT · REFERRALS
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3 leading-tight">
            Bring the signal to
            <br />
            <span className="text-hud-accent">your desk network</span>
          </h1>
          <p className="font-mono text-sm text-hud-muted mb-10 leading-relaxed max-w-2xl">
            Refer analysts, traders and journalists to The Sunday Convergence
            Report. Unlock tiered rewards at 3, 10, 25 and 100 referrals —
            archive access, country alerts, branded swag and a private
            monthly briefing.
          </p>

          <ReferralDashboard />

          {/* Back */}
          <div className="mt-12 text-center border-t border-hud-border/40 pt-6">
            <Link
              href="/briefing"
              className="font-mono text-[11px] text-hud-accent border border-hud-accent/40 px-4 py-2 rounded hover:bg-hud-accent/10"
            >
              ← BACK TO BRIEFING
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
