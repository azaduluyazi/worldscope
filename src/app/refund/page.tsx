import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "WorldScope refund and cancellation policy for premium mail subscriptions.",
  openGraph: {
    title: "Refund Policy — WorldScope",
    description: "WorldScope refund and cancellation policy.",
  },
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-hud-base text-hud-text">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="font-mono text-[10px] text-hud-accent hover:underline">
            ← BACK TO DASHBOARD
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
            <h2 className="text-sm text-hud-text tracking-wider mb-3">1. SUBSCRIPTION OVERVIEW</h2>
            <p>
              WorldScope offers a premium mail subscription service at $1.00 USD per month.
              This subscription includes daily intelligence briefings, breaking critical alerts,
              weekly trend analysis reports, and geopolitical analysis delivered directly to your email.
            </p>
          </section>

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">2. FREE CANCELLATION</h2>
            <p>
              You may cancel your subscription at any time with no questions asked.
              Cancellation takes effect at the end of your current billing period.
              You will continue to receive emails until the end of the period you have already paid for.
            </p>
            <p className="mt-2">
              To cancel, use the subscription management link in any email we send you,
              or contact us at{" "}
              <a href="mailto:noreply@troiamedia.com" className="text-hud-accent hover:underline">
                noreply@troiamedia.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">3. REFUND POLICY</h2>
            <p>
              Due to the low cost of the subscription ($1/month) and the digital nature of the service,
              we generally do not offer refunds for past billing periods. However, we understand that
              issues can arise, and we handle refund requests on a case-by-case basis.
            </p>
            <div className="mt-3 bg-hud-surface border border-hud-border rounded p-4">
              <p className="text-hud-text font-bold mb-2">We will issue a full refund if:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>You were charged in error or experienced a technical billing issue</li>
                <li>You did not receive the promised email service for a billing period</li>
                <li>You request a refund within 7 days of your first subscription payment</li>
                <li>Duplicate charges occurred</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">4. HOW TO REQUEST A REFUND</h2>
            <p>
              To request a refund, please email us at{" "}
              <a href="mailto:noreply@troiamedia.com" className="text-hud-accent hover:underline">
                noreply@troiamedia.com
              </a>{" "}
              with the subject line &ldquo;Refund Request&rdquo; and include:
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Your email address used for the subscription</li>
              <li>The date of the charge</li>
              <li>Reason for the refund request</li>
            </ul>
            <p className="mt-2">
              We aim to process all refund requests within 5-7 business days.
              Approved refunds will be returned to your original payment method via Paddle.
            </p>
          </section>

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">5. FREE SITE ACCESS</h2>
            <p>
              The WorldScope dashboard at troiamedia.com is completely free to use and does not
              require any payment or subscription. The refund policy applies only to the optional
              premium mail subscription service.
            </p>
          </section>

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">6. PAYMENT PROCESSOR</h2>
            <p>
              All payments are processed securely by{" "}
              <a href="https://paddle.com" className="text-hud-accent hover:underline" target="_blank" rel="noopener noreferrer">
                Paddle.com
              </a>, our Merchant of Record. Paddle handles all billing, tax compliance,
              and payment processing. For billing inquiries, you may also contact Paddle directly.
            </p>
          </section>

          <section>
            <h2 className="text-sm text-hud-text tracking-wider mb-3">7. CONTACT</h2>
            <p>
              For any questions regarding refunds or billing, please contact us at{" "}
              <a href="mailto:noreply@troiamedia.com" className="text-hud-accent hover:underline">
                noreply@troiamedia.com
              </a>.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-hud-border">
          <div className="flex flex-wrap gap-4 font-mono text-[9px] text-hud-muted">
            <Link href="/privacy" className="hover:text-hud-accent">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-hud-accent">Terms of Service</Link>
            <Link href="/about" className="hover:text-hud-accent">About</Link>
            <Link href="/contact" className="hover:text-hud-accent">Contact</Link>
            <Link href="/" className="hover:text-hud-accent">Dashboard</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
