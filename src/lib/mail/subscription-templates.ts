/**
 * Transactional email templates for Gaia subscription lifecycle.
 *
 * Uses {{EMAIL}} + {{SIG}} placeholders for per-recipient footer
 * substitution via lib/mail/sender.ts. Colour palette matches the
 * briefing templates so all WorldScope email feels from one brand.
 */

export interface WelcomeParams {
  cycle: "monthly" | "annual" | null;
  manageUrl: string;       // deep link to /settings/subscription
  customerPortalUrl?: string | null;
}

export interface PaymentFailedParams {
  cycle: "monthly" | "annual" | null;
  updatePaymentUrl?: string | null;
  customerPortalUrl?: string | null;
  manageUrl: string;
}

const BRAND_HEADER = (title: string, accent: string) => `
<div style="background:#050a12;padding:24px 24px 16px;text-align:left;border-bottom:1px solid #1a2540;">
  <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:${accent};letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">WorldScope · Gaia</div>
  <h1 style="margin:0;font-family:'JetBrains Mono',monospace;font-size:22px;color:#e8f0fc;font-weight:bold;">${title}</h1>
</div>`;

const FOOTER = `
<div style="padding:16px 24px;border-top:1px solid #1a2540;background:#050a12;text-align:center;">
  <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#4a5568;line-height:1.6;">
    WorldScope · <a href="https://troiamedia.com" style="color:#4a9eff;text-decoration:none;">troiamedia.com</a><br/>
    <a href="https://troiamedia.com/api/newsletter/unsubscribe?email={{EMAIL}}&sig={{SIG}}" style="color:#4a5568;text-decoration:underline;">Unsubscribe</a> ·
    <a href="https://troiamedia.com/settings/subscription" style="color:#4a5568;text-decoration:underline;">Manage Subscription</a>
  </div>
</div>`;

function priceLine(cycle: WelcomeParams["cycle"]): string {
  if (cycle === "annual") return "Plan: Gaia · $90/year (2 months free)";
  if (cycle === "monthly") return "Plan: Gaia · $9/month";
  return "Plan: Gaia";
}

export function buildWelcomeEmail(p: WelcomeParams): {
  subject: string;
  html: string;
} {
  const subject = "Welcome to Gaia — your first Sunday Convergence Report is on its way";
  const html = `
<!DOCTYPE html><html><body style="margin:0;background:#050a12;font-family:Inter,Arial,sans-serif;color:#e8f0fc;">
<div style="max-width:600px;margin:0 auto;background:#0a1530;border:1px solid #1a2540;">
  ${BRAND_HEADER("Welcome to Gaia.", "#f5a524")}
  <div style="padding:24px;line-height:1.7;">
    <p style="color:#e8f0fc;font-size:14px;margin:0 0 14px;">
      Your subscription is active. Every Sunday at 07:00 UTC you'll receive
      the <strong>Convergence Report</strong> — a multi-signal digest of
      what the 689 intelligence sources we monitor agree on this week.
    </p>
    <p style="color:#9fb3d9;font-size:12px;margin:0 0 20px;">${priceLine(p.cycle)}</p>

    <div style="border-left:3px solid #f5a524;padding:12px 16px;background:#050a12;margin:0 0 20px;">
      <div style="color:#f5a524;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">First report</div>
      <div style="color:#c0d0e0;font-size:13px;">
        Delivered next Sunday morning. Between now and then, you can set
        country filters, frequency (daily too if you want), and quiet
        hours from your subscription page.
      </div>
    </div>

    <div style="text-align:center;margin:24px 0;">
      <a href="${p.manageUrl}" style="display:inline-block;background:#f5a524;color:#050a12;font-family:'JetBrains Mono',monospace;font-weight:bold;font-size:12px;letter-spacing:1.5px;padding:12px 24px;text-decoration:none;border-radius:4px;">
        SET MY PREFERENCES →
      </a>
    </div>

    ${p.customerPortalUrl ? `<p style="color:#6a7a99;font-size:11px;text-align:center;margin:16px 0 0;">Need to update billing? <a href="${p.customerPortalUrl}" style="color:#4a9eff;text-decoration:underline;">Customer portal</a></p>` : ""}

    <p style="color:#6a7a99;font-size:11px;margin:24px 0 0;">
      Reply to this email if anything looks off. Editorial standards live at
      <a href="https://troiamedia.com/editorial-policy" style="color:#4a9eff;">/editorial-policy</a>.
    </p>
  </div>
  ${FOOTER}
</div>
</body></html>`;
  return { subject, html };
}

export function buildPaymentFailedEmail(p: PaymentFailedParams): {
  subject: string;
  html: string;
} {
  const subject = "Your Gaia payment didn't go through — quick update needed";
  const recoveryUrl = p.updatePaymentUrl || p.customerPortalUrl || p.manageUrl;

  const html = `
<!DOCTYPE html><html><body style="margin:0;background:#050a12;font-family:Inter,Arial,sans-serif;color:#e8f0fc;">
<div style="max-width:600px;margin:0 auto;background:#0a1530;border:1px solid #1a2540;">
  ${BRAND_HEADER("Payment update needed", "#ff9500")}
  <div style="padding:24px;line-height:1.7;">
    <p style="color:#e8f0fc;font-size:14px;margin:0 0 14px;">
      Your most recent Gaia renewal charge didn't complete. The usual
      causes are an expired card or a temporary hold from your bank — a
      quick update to your payment method usually fixes it.
    </p>
    <p style="color:#9fb3d9;font-size:12px;margin:0 0 20px;">${priceLine(p.cycle)}</p>

    <div style="border-left:3px solid #ff9500;padding:12px 16px;background:#050a12;margin:0 0 20px;">
      <div style="color:#ff9500;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">What happens next</div>
      <div style="color:#c0d0e0;font-size:13px;">
        Lemon Squeezy will retry the charge automatically over the next
        few days. If all retries fail, your subscription will move to
        past-due, then expire. No briefings will be interrupted while
        retries are still running.
      </div>
    </div>

    <div style="text-align:center;margin:24px 0;">
      <a href="${recoveryUrl}" style="display:inline-block;background:#ff9500;color:#050a12;font-family:'JetBrains Mono',monospace;font-weight:bold;font-size:12px;letter-spacing:1.5px;padding:12px 24px;text-decoration:none;border-radius:4px;">
        UPDATE PAYMENT METHOD →
      </a>
    </div>

    <p style="color:#6a7a99;font-size:11px;margin:24px 0 0;">
      If you'd rather cancel instead, you can do so from
      <a href="${p.manageUrl}" style="color:#4a9eff;">your subscription page</a>.
      Reply to this email if you need a human — we read every reply.
    </p>
  </div>
  ${FOOTER}
</div>
</body></html>`;
  return { subject, html };
}
