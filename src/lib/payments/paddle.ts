/**
 * Paddle Payment Integration — Mail subscription management.
 * WorldScope site is FREE (ad-supported). Premium = $1/mo mail service.
 *
 * Setup:
 * 1. Create Paddle account at paddle.com
 * 2. Add product + price ($1/mo) in Paddle dashboard
 * 3. Set env vars: PADDLE_API_KEY, NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
 *    PADDLE_WEBHOOK_SECRET, NEXT_PUBLIC_PADDLE_PRICE_ID
 * 4. Configure webhook URL: https://troiamedia.com/api/payments/webhook
 */

export interface PaddleConfig {
  apiKey: string | undefined;
  clientToken: string | undefined;
  webhookSecret: string | undefined;
  priceId: string | undefined;
  environment: "sandbox" | "production";
}

export function getPaddleConfig(): PaddleConfig {
  return {
    apiKey: process.env.PADDLE_API_KEY,
    clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET,
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID,
    environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
  };
}

export function isPaddleConfigured(): boolean {
  const config = getPaddleConfig();
  return !!(config.apiKey && config.clientToken && config.priceId);
}

export type SubscriptionStatus = "active" | "trialing" | "past_due" | "paused" | "canceled" | "none";

export interface UserSubscription {
  status: SubscriptionStatus;
  planName: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/** Site is completely free — ad-supported, no login required */
export const SITE_FREE = {
  name: "WorldScope",
  tagline: "Free forever — no signup needed",
  features: [
    "Full real-time intel feed (2000+ sources)",
    "2D tactical map + 3D globe (5 modes)",
    "AI briefings & summaries",
    "232 live TV channels",
    "Prediction markets & economics",
    "37+ live intel sources",
    "20 dashboard themes",
    "30 languages",
  ],
};

/** $1/month mail subscription — daily briefing + alerts + weekly report */
export const MAIL_PREMIUM = {
  name: "Premium Intel Mail",
  price: 1,
  period: "month" as const,
  tagline: "AI intelligence delivered to your inbox",
  features: [
    "Daily AI situation briefing (08:00 UTC)",
    "Instant breaking critical alerts",
    "Weekly trend analysis report",
    "Weekly geopolitical analysis",
    "Priority event notifications",
    "Ad-free email content",
  ],
};
