import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/shared/LegalFooter";

export const metadata: Metadata = {
  title: "Refund Policy — WorldScope",
  description:
    "Refund and cancellation policy for WorldScope. The core dashboard is free. The upcoming Premium Intelligence Briefing ($1/country/month) ships with a 14-day money-back guarantee and cancel-anytime renewals.",
  alternates: { canonical: "/refund" },
  openGraph: {
    title: "Refund Policy — WorldScope",
    description:
      "Refund terms for the upcoming Premium Intelligence Briefing — 14-day money-back guarantee, cancel anytime.",
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
            REFUND &amp; CANCELLATION POLICY
          </h1>
          <p className="font-mono text-[10px] text-hud-muted">
            Last updated: April 2026
          </p>
        </div>

        <div className="space-y-8 font-mono text-[11px] leading-relaxed text-hud-muted">

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">1. CORE DASHBOARD — FREE</h2>
            <p>
              The WorldScope core dashboard (real-time news feeds, maps, channels,
              AI analytics, free daily newsletter) is provided at no cost and is
              supported by advertising. No payment information is collected for the
              free dashboard, and no refund applies because no charge is made.
            </p>
          </section>

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">
              2. PREMIUM INTELLIGENCE BRIEFING — REFUND TERMS
            </h2>
            <p className="mb-3">
              WorldScope is preparing to launch an optional paid add-on called the
              <strong> Premium Intelligence Briefing</strong> at{" "}
              <strong>$1 per selected country, billed monthly</strong>. The free
              dashboard remains unchanged. The following terms apply once the paid
              briefing is live:
            </p>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                <strong>14-day money-back guarantee:</strong> If you are not
                satisfied with your first paid month, you may request a full
                refund within 14 days of the initial charge by emailing{" "}
                <a href="mailto:info@troiamedia.com" className="text-hud-accent hover:underline">
                  info@troiamedia.com
                </a>{" "}
                from the address used at signup. We will process the refund within
                5 business days to the original payment method.
              </li>
              <li>
                <strong>Cancel anytime:</strong> You can cancel your subscription
                at any time from the customer portal link included in your receipt
                email. Cancellation stops all future charges immediately.
              </li>
              <li>
                <strong>Renewals:</strong> Subscriptions renew automatically each
                month at $1 per country selected. Renewal charges are
                non-refundable after the 14-day initial window, but you retain
                full access to the briefing through the end of the paid period.
              </li>
              <li>
                <strong>Service failure:</strong> If the briefing is not delivered
                due to a problem on our side, contact us and we will either
                restore service or issue a prorated refund for the affected
                period.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">3. PAYMENT PROCESSING</h2>
            <p>
              When the Premium Intelligence Briefing launches, payments will be
              processed by a third-party merchant of record handling billing,
              invoicing, applicable sales tax, and chargebacks. WorldScope does
              not store or have direct access to your full card number. Refund
              requests are honored by WorldScope under the terms above; the
              merchant of record executes the refund.
            </p>
          </section>

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">4. FREE NEWSLETTER</h2>
            <p>
              The free daily newsletter remains free. No payment is required to
              subscribe. You can unsubscribe at any time using the link in any
              newsletter email or by emailing us.
            </p>
          </section>

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">5. CONTACT</h2>
            <p>
              Refund requests, cancellation help, or questions about billing —{" "}
              <a href="mailto:info@troiamedia.com" className="text-hud-accent hover:underline">
                info@troiamedia.com
              </a>. We aim to reply within 2 business days.
            </p>
          </section>
        </div>

        <LegalFooter />
      </div>
    </div>
  );
}
