import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/db/supabase";

export const runtime = "nodejs";

/**
 * GET /api/newsletter/unsubscribe?email=xxx
 * One-click unsubscribe from email link.
 */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return new Response("Email required", { status: 400 });
  }

  try {
    const db = createServerClient();
    await db
      .from("newsletter_subscribers")
      .update({ is_active: false })
      .eq("email", decodeURIComponent(email));

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
  } catch {
    return new Response("Unsubscribe failed", { status: 500 });
  }
}
