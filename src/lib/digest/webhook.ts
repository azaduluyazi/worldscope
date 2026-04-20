/**
 * Generic webhook digest adapter.
 *
 * Posts a raw JSON payload to the user-supplied URL with an optional
 * HMAC-SHA256 signature header so the receiver can verify authenticity.
 * Target shape is Zapier/n8n/make-friendly: a flat `digest` object + a
 * nested `items` array of DigestItem.
 *
 * When `sharedSecret` is supplied, we sign the raw body with HMAC-SHA256
 * and include it as `X-WorldScope-Signature: sha256=<hex>`.
 */

import { createHmac } from "node:crypto";
import type { DigestItem, DigestMeta, DispatchResult } from "./types";

export interface WebhookOptions {
  sharedSecret?: string;
  /** Extra headers to forward (e.g. an API key the user keyed to the receiver). */
  headers?: Record<string, string>;
}

export async function sendGenericWebhook(
  url: string,
  items: DigestItem[],
  meta: DigestMeta = {},
  opts: WebhookOptions = {},
): Promise<DispatchResult> {
  const payload = {
    digest: {
      title: meta.title ?? null,
      assessment: meta.assessment ?? null,
      tier: meta.tier ?? null,
      brandUrl: meta.brandUrl ?? "https://troiamedia.com",
      generatedAt: new Date().toISOString(),
      itemCount: items.length,
    },
    items,
  };
  const body = JSON.stringify(payload);

  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-worldscope-source": "digest",
    ...(opts.headers ?? {}),
  };
  if (opts.sharedSecret) {
    const hex = createHmac("sha256", opts.sharedSecret).update(body).digest("hex");
    headers["x-worldscope-signature"] = `sha256=${hex}`;
  }

  try {
    const res = await fetch(url, { method: "POST", headers, body });
    return { channel: "webhook", ok: res.ok, status: res.status };
  } catch (err) {
    return {
      channel: "webhook",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
