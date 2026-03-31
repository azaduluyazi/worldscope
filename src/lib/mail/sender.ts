/**
 * Mail sender using Resend API.
 * Sends daily briefings to all active subscribers (free).
 */

const RESEND_API = "https://api.resend.com/emails";

interface SendMailParams {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Send email via Resend API.
 * Supports single recipient or batch (up to 100).
 */
export async function sendMail(params: SendMailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const fromEmail = process.env.MAIL_FROM || "WorldScope <noreply@troiamedia.com>";

  try {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];

    for (let i = 0; i < recipients.length; i += 100) {
      const batch = recipients.slice(i, i + 100);

      const res = await fetch(`${RESEND_API}/batch`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          batch.map((email) => ({
            from: fromEmail,
            to: email,
            subject: params.subject,
            html: params.html.replace("{{EMAIL}}", encodeURIComponent(email)),
          }))
        ),
      });

      if (!res.ok) {
        console.error(`[Mail] Batch send failed: ${res.status}`);
      }
    }

    return true;
  } catch (e) {
    console.error("[Mail] Send error:", e);
    return false;
  }
}

/**
 * Get all active newsletter subscribers from Supabase.
 */
export async function getActiveSubscribers(): Promise<string[]> {
  const { createServerClient } = await import("@/lib/db/supabase");
  const db = createServerClient();

  const { data, error } = await db
    .from("newsletter_subscribers")
    .select("email")
    .eq("is_active", true);

  if (error || !data) return [];
  return data.map((r) => r.email);
}
