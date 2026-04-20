/**
 * Lemon Squeezy integration helpers.
 *
 * - `verifyWebhookSignature` for HMAC-SHA256 verification on inbound webhooks
 * - `lemonFetch` typed wrapper around the Lemon Squeezy REST API
 * - `createCheckoutUrl` to generate per-customer checkout URLs
 *
 * Secrets come from env (never hardcode): LEMONSQUEEZY_API_KEY,
 * LEMONSQUEEZY_WEBHOOK_SECRET, LEMONSQUEEZY_STORE_ID.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const API_BASE = "https://api.lemonsqueezy.com/v1";

export const LEMON_EVENTS = [
  "order_created",
  "order_refunded",
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_resumed",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
  "subscription_payment_success",
  "subscription_payment_failed",
  "subscription_payment_refunded",
] as const;

export type LemonEventName = (typeof LEMON_EVENTS)[number];

export interface LemonWebhookMeta {
  event_name: LemonEventName;
  webhook_id?: string;
  custom_data?: Record<string, string | number | null>;
}

export interface LemonWebhookPayload {
  meta: LemonWebhookMeta;
  data: {
    id: string;
    type: string;
    attributes: Record<string, unknown>;
  };
}

/**
 * HMAC-SHA256 verification for inbound Lemon Squeezy webhooks.
 * Pass the RAW request body (bytes) — parsed JSON won't match.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(signatureHeader, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

class LemonApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "LemonApiError";
  }
}

export async function lemonFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const key = process.env.LEMONSQUEEZY_API_KEY;
  if (!key) throw new Error("LEMONSQUEEZY_API_KEY is not set");

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${key}`,
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new LemonApiError(
      `Lemon Squeezy API ${res.status} on ${path}`,
      res.status,
      body,
    );
  }
  return (await res.json()) as T;
}

export interface CheckoutOptions {
  variantId: string;
  email?: string;
  userId?: string;
  customData?: Record<string, string>;
  redirectUrl?: string;
}

/**
 * Create a Lemon Squeezy Checkout session and return its URL.
 * Attach `userId` to `custom_data` so the webhook can link subscription
 * rows back to your user table.
 */
export async function createCheckoutUrl(opts: CheckoutOptions): Promise<string> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) throw new Error("LEMONSQUEEZY_STORE_ID is not set");

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_options: { embed: false, dark: true },
        checkout_data: {
          email: opts.email,
          custom: opts.customData ?? (opts.userId ? { user_id: opts.userId } : {}),
        },
        product_options: opts.redirectUrl
          ? { redirect_url: opts.redirectUrl }
          : undefined,
      },
      relationships: {
        store: { data: { type: "stores", id: storeId } },
        variant: { data: { type: "variants", id: opts.variantId } },
      },
    },
  };

  const res = await lemonFetch<{ data: { attributes: { url: string } } }>(
    "/checkouts",
    { method: "POST", body: JSON.stringify(body) },
  );
  return res.data.attributes.url;
}
