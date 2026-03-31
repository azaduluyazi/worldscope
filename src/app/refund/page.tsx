import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/shared/LegalFooter";

export const metadata: Metadata = {
  title: "Refund Policy — WorldScope",
  description: "WorldScope is a completely free platform. No charges, no refunds needed.",
  openGraph: {
    title: "Refund Policy — WorldScope",
    description: "WorldScope is free. No payments are collected.",
  },
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-hud-base text-hud-text">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="font-mono text-[10px] text-hud-accent hover:underline">
            &larr; BACK TO DASHBOARD
          </Link>
          <h1 className="font-mono text-2xl text-hud-accent tracking-wider mt-6 mb-2">
            REFUND POLICY
          </h1>
          <p className="font-mono text-[10px] text-hud-muted">
            Last updated: March 2026
          </p>
        </div>

        <div className="space-y-8 font-mono text-[11px] leading-relaxed text-hud-muted">

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">1. FREE SERVICE</h2>
            <p>
              WorldScope is a completely free platform. We do not charge users for
              any features, and no payment information is collected. Because there
              are no charges, no refund policy is applicable.
            </p>
          </section>

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">2. NO PAYMENTS COLLECTED</h2>
            <p>
              WorldScope does not process any payments. The platform is entirely
              ad-supported and all features are available at no cost. There are no
              subscriptions, no premium tiers, and no in-app purchases.
            </p>
          </section>

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">3. NEWSLETTER</h2>
            <p>
              WorldScope offers a free email newsletter. No payment is required to
              subscribe. You may unsubscribe at any time using the link in any
              email or by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">4. CONTACT</h2>
            <p>
              For any questions, please contact us at{" "}
              <a href="mailto:info@troiamedia.com" className="text-hud-accent hover:underline">
                info@troiamedia.com
              </a>.
            </p>
          </section>
        </div>

        <LegalFooter />
      </div>
    </div>
  );
}
