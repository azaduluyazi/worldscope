import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { refundSubscriptionInvoice, LemonApiError } from "@/lib/lemon-squeezy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/subscriptions/[id]/refund
 * Body: { invoice_id: string }
 *
 * Refunds a specific Lemon subscription-invoice. Fetch the invoice
 * list via GET /api/admin/subscriptions/[id] to get valid IDs.
 */
export async function POST(
  request: NextRequest,
) {
  const guard = requireAdmin(request);
  if (guard) return guard;

  const body = (await request.json().catch(() => ({}))) as {
    invoice_id?: string;
  };
  if (!body.invoice_id) {
    return NextResponse.json({ error: "invoice_id required" }, { status: 400 });
  }

  try {
    const result = await refundSubscriptionInvoice(body.invoice_id);
    return NextResponse.json({ ok: true, lemon: result });
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
