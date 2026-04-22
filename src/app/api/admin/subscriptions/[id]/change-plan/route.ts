import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { requireAdmin } from "@/lib/admin/auth";
import {
  changeSubscriptionVariant,
  LemonApiError,
} from "@/lib/lemon-squeezy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/subscriptions/[id]/change-plan
 * Body: { cycle: "monthly" | "annual", invoice_immediately?: boolean }
 *
 * Resolves the target variant id from the NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_GAIA
 * / _ANNUAL env vars. For cross-tier moves (e.g. a future Prometheus)
 * pass `variant_id` directly instead of `cycle`.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = requireAdmin(request);
  if (guard) return guard;

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    cycle?: "monthly" | "annual";
    variant_id?: string;
    invoice_immediately?: boolean;
    disable_prorate?: boolean;
  };

  let variantId = body.variant_id;
  if (!variantId && body.cycle === "monthly") {
    variantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_GAIA;
  } else if (!variantId && body.cycle === "annual") {
    variantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_GAIA_ANNUAL;
  }
  if (!variantId) {
    return NextResponse.json(
      { error: "variant_id or known cycle required" },
      { status: 400 },
    );
  }

  const db = createServerClient();
  const { data: sub } = await db
    .from("subscriptions")
    .select("lemon_subscription_id, lemon_variant_id")
    .eq("id", id)
    .maybeSingle();

  if (!sub?.lemon_subscription_id) {
    return NextResponse.json({ error: "subscription not linked to Lemon" }, { status: 404 });
  }

  if (sub.lemon_variant_id === variantId) {
    return NextResponse.json({ error: "already on requested variant" }, { status: 409 });
  }

  try {
    const result = await changeSubscriptionVariant(
      sub.lemon_subscription_id,
      variantId,
      {
        invoiceImmediately: body.invoice_immediately,
        disableProrate: body.disable_prorate,
      },
    );
    return NextResponse.json({ ok: true, lemon: result.attributes });
  } catch (err) {
    if (err instanceof LemonApiError) {
      return NextResponse.json(
        { error: err.message, status: err.status, body: err.body },
        { status: 502 },
      );
    }
    throw err;
  }
}
