/**
 * Paddle Payment Integration — Subscription management.
 * Handles Pro tier subscriptions for WorldScope.
 *
 * Setup:
 * 1. Create Paddle account at paddle.com
 * 2. Add product + price in Paddle dashboard
 * 3. Set env vars: PADDLE_API_KEY, NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
 *    PADDLE_WEBHOOK_SECRET, NEXT_PUBLIC_PADDLE_PRICE_ID
 * 4. Configure webhook URL: https://worldscope-two.vercel.app/api/payments/webhook
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

export const FREE_TIER = {
  name: "Free",
  features: [
    "Real-time intel feed (200 items)",
    "2D tactical map",
    "3 AI briefings/day",
    "10 live TV channels",
  ],
};

export const PRO_TIER = {
  name: "Pro",
  features: [
    "Unlimited intel feed (2000+ items)",
    "3D globe + all map modes",
    "Unlimited AI briefings + summaries",
    "232 live TV channels + HLS",
    "Prediction markets panel",
    "Economic indicators (IMF, BIS, Big Mac)",
    "Weather globe mode",
    "Priority OREF alerts",
    "API access",
    "No ads",
  ],
};
