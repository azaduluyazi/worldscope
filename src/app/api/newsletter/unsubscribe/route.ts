import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { verifyUnsubscribe } from "@/lib/mail/unsubscribe-token";

export const runtime = "nodejs";

/**
 * GET /api/newsletter/unsubscribe?email=xxx&sig=xxx
 * One-click unsubscribe. `sig` is an HMAC-SHA256 of the email produced by the
 * mail sender; without a valid sig the request is rejected so unauthenticated
 * parties cannot unsubscribe arbitrary addresses.
 */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  const sig = request.nextUrl.searchParams.get("sig");

  if (!email || !sig) {
    return new Response("Email and signature required", { status: 400 });
  }

  const decoded = decodeURIComponent(email);
  if (!verifyUnsubscribe(decoded, sig)) {
    return new Response("Invalid signature", { status: 403 });
  }

  try {
    const db = createServerClient();
    await db
      .from("newsletter_subscribers")
      .update({ is_active: false })
      .eq("email", decoded);

    return new Response(
      `<html><body style="background:#050a12;color:#e2e8f0;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;">
        <div style="text-align:center;">
          <h2 style="color:#00e5ff;">Unsubscribed</h2>
          <p>You have been unsubscribed from WorldScope emails.</p>
          <a href="https://troiamedia.com" style="color:#00e5ff;">Return to Dashboard</a>
        </div>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err) {
    console.error("[unsubscribe] DB error:", err);
    return new Response("Unsubscribe failed", { status: 500 });
  }
}
