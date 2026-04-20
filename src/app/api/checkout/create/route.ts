/**
 * POST /api/checkout/create
 *
 * Body: { variantId: string, email?: string, userId?: string, redirectUrl?: string }
 * Returns: { url: string }
 *
 * Client calls this endpoint, then redirects the user to the returned
 * Lemon Squeezy checkout URL (opens in overlay or new tab depending on
 * UI choice). `user_id` goes into custom_data so the webhook handler
 * can link the resulting subscription row to your user table.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutUrl } from "@/lib/lemon-squeezy";

export const runtime = "nodejs";

const BodySchema = z.object({
  variantId: z.string().min(1),
  email: z.string().email().optional(),
  userId: z.string().optional(),
  redirectUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const url = await createCheckoutUrl(parsed.data);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[checkout] create failed", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
