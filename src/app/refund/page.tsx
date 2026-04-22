import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/shared/LegalFooter";

export const metadata: Metadata = {
  title: "Refund Policy — WorldScope",
  description:
    "Refund and cancellation policy for WorldScope. The core dashboard is free. Gaia ($9/month or $90/year) is non-refundable but can be cancelled any time, with access continuing to the end of the paid period.",
  alternates: { canonical: "/refund" },
  openGraph: {
    title: "Refund Policy — WorldScope",
    description:
      "Gaia subscription: cancel anytime, non-refundable, GDPR data rights included.",
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
              2. GAIA SUBSCRIPTION — REFUND TERMS
            </h2>
            <p className="mb-3">
              WorldScope&apos;s single paid tier is <strong>Gaia</strong>, which
              unlocks the weekly <em>Sunday Convergence Report</em> PDF and
              personalised digest preferences. Two billing cycles are available:
            </p>
            <ul className="space-y-1 list-disc pl-5 mb-3">
              <li><strong>Gaia Monthly</strong> — $9 per month, recurring.</li>
              <li><strong>Gaia Annual</strong> — $90 per year, recurring (two months free versus monthly).</li>
            </ul>
            <p className="mb-3">
              The free dashboard remains unchanged. The following refund terms
              apply to Gaia:
            </p>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                <strong>Non-refundable after purchase.</strong> Because Gaia is a
                fully digital subscription that begins delivery immediately on the
                next Sunday briefing cycle, payments are <strong>not refundable</strong>{" "}
                once the charge has cleared. Consider this before subscribing;
                sample issues of the briefing are available at{" "}
                <Link href="/newsletter/sample" className="text-hud-accent hover:underline">
                  /newsletter/sample
                </Link>.
              </li>
              <li>
                <strong>Cancel anytime.</strong> You can cancel from your
                subscription page (
                <Link href="/settings/subscription" className="text-hud-accent hover:underline">
                  /settings/subscription
                </Link>
                ) or the customer-portal link in your receipt email. Cancellation
                stops all future charges immediately and keeps your access active
                through the end of the current billing period.
              </li>
              <li>
                <strong>Renewals.</strong> Subscriptions renew automatically at
                the end of each paid period. Renewal charges are non-refundable;
                your remedy is to cancel before the next renewal so no further
                charge is made. We do not issue partial refunds for unused time
                after a renewal.
              </li>
              <li>
                <strong>Service failure.</strong> If we fail to deliver the Sunday
                briefing for reasons on our side, email us and we will either
                restore service or, at our discretion, issue a prorated credit or
                refund for the specific affected period.
              </li>
              <li>
                <strong>Fraudulent or unauthorised charges.</strong> If a charge
                was made without your consent, contact us and your card issuer.
                We cooperate fully with the merchant of record and the card
                network to investigate and reverse fraudulent transactions.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">3. PAYMENT PROCESSING</h2>
            <p>
              Gaia payments are processed by a third-party merchant of record
              handling billing, invoicing, applicable sales tax, and chargebacks.
              WorldScope does not store or have direct access to your full card
              number. Cancellation and refund requests are honored by WorldScope
              under the terms above; the merchant of record executes the
              cancellation or refund against your original payment method.
            </p>
          </section>

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">
              4. GDPR / DATA RIGHTS
            </h2>
            <p className="mb-3">
              Subscribers based in the EU, UK, and jurisdictions with equivalent
              data-protection laws have the following rights regardless of
              subscription status:
            </p>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                <strong>Access &amp; export.</strong> You can request a copy of
                the personal data we hold about you (account email, subscription
                status, briefing delivery logs, digest preferences) in a machine-
                readable format within 30 days, at no cost.
              </li>
              <li>
                <strong>Deletion (right to be forgotten).</strong> You can
                request permanent deletion of your account and associated data.
                Once confirmed, your user profile, subscription history,
                preferences, and any stored PII are removed within 30 days.
                Financial records required for accounting / tax purposes are
                retained by the merchant of record as required by applicable
                law.
              </li>
              <li>
                <strong>Correction.</strong> You can correct inaccurate profile
                data via{" "}
                <Link href="/settings/subscription" className="text-hud-accent hover:underline">
                  /settings/subscription
                </Link>{" "}
                and briefing preferences at{" "}
                <Link href="/preferences" className="text-hud-accent hover:underline">
                  /preferences
                </Link>
                , or email us for fields not user-editable.
              </li>
              <li>
                <strong>Portability &amp; complaint.</strong> You may transfer
                your exported data to another service and, if you believe we
                have mishandled your data, lodge a complaint with the relevant
                supervisory authority in your country.
              </li>
            </ul>
            <p className="mt-3">
              Send any of the above requests to{" "}
              <a href="mailto:info@troiamedia.com" className="text-hud-accent hover:underline">
                info@troiamedia.com
              </a>{" "}
              from the address used at signup; we will verify the request and
              respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">5. FREE NEWSLETTER</h2>
            <p>
              The free daily newsletter remains free. No payment is required to
              subscribe. You can unsubscribe at any time using the link in any
              newsletter email or by emailing us.
            </p>
          </section>

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">6. CUSTOM / ADDITIONAL COVERAGE</h2>
            <p>
              Gaia covers global intelligence (689 sources, 195 countries) with
              weekly delivery. If you need custom country filters, higher delivery
              frequency, API access, or a bespoke arrangement beyond the
              published Gaia cycles, email{" "}
              <a href="mailto:info@troiamedia.com" className="text-hud-accent hover:underline">
                info@troiamedia.com
              </a>{" "}
              and we will reply with options and a quote.
            </p>
          </section>

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">7. CONTACT</h2>
            <p>
              Cancellation help, data requests, or billing questions —{" "}
              <a href="mailto:info@troiamedia.com" className="text-hud-accent hover:underline">
                info@troiamedia.com
              </a>
              . We aim to reply within 2 business days.
            </p>
          </section>
        </div>

        <LegalFooter />
      </div>
    </div>
  );
}
