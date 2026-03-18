import { Resend } from "resend";
import { createServerClient } from "@/lib/db/supabase";
import type { IntelItem, Severity } from "@/types/intel";

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "#ff4757",
  high: "#ffd000",
  medium: "#00e5ff",
  low: "#00ff88",
  info: "#8a5cf6",
};

interface Subscriber {
  id: string;
  email: string;
  frequency: string;
  categories: string[];
}

function buildDigestHtml(items: IntelItem[], frequency: string): string {
  const sevCounts: Record<string, number> = {};
  items.forEach((i) => { sevCounts[i.severity] = (sevCounts[i.severity] || 0) + 1; });

  const topItems = items.slice(0, 15);
  const period = frequency === "weekly" ? "7 days" : "24 hours";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050a12;color:#c0d0e0;font-family:'Courier New',monospace;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="border-bottom:1px solid #1a2a4a;padding-bottom:16px;margin-bottom:16px;">
      <h1 style="color:#00e5ff;font-size:18px;margin:0;">WORLDSCOPE</h1>
      <p style="color:#5a7a9a;font-size:11px;margin:4px 0 0;">Intelligence Digest — Last ${period}</p>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:16px;">
      ${(["critical", "high", "medium", "low", "info"] as Severity[]).map((sev) =>
        `<span style="color:${SEVERITY_COLORS[sev]};font-size:11px;">${sev.toUpperCase()}: ${sevCounts[sev] || 0}</span>`
      ).join(" | ")}
    </div>

    <p style="color:#5a7a9a;font-size:10px;margin-bottom:12px;">Total: ${items.length} events</p>

    ${topItems.map((item) => `
    <div style="border-left:3px solid ${SEVERITY_COLORS[item.severity]};padding:8px 12px;margin-bottom:8px;background:#0a1530;">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;">
        <span style="color:${SEVERITY_COLORS[item.severity]};font-size:9px;font-weight:bold;">${item.severity.toUpperCase()}</span>
        <span style="color:#5a7a9a;font-size:9px;">${item.category.toUpperCase()}</span>
      </div>
      <a href="${item.url}" style="color:#c0d0e0;font-size:12px;text-decoration:none;">${item.title}</a>
      <div style="color:#5a7a9a;font-size:9px;margin-top:4px;">${item.source} • ${new Date(item.publishedAt).toLocaleDateString()}</div>
    </div>
    `).join("")}

    <div style="border-top:1px solid #1a2a4a;padding-top:16px;margin-top:16px;text-align:center;">
      <a href="https://worldscope.app" style="color:#00e5ff;font-size:10px;">Open WorldScope Dashboard →</a>
      <p style="color:#5a7a9a;font-size:8px;margin-top:8px;">You're receiving this because you subscribed to WorldScope digests.</p>
    </div>
  </div>
</body>
</html>`;
}

/** Send email digest to all active subscribers matching frequency */
export async function sendDigests(
  items: IntelItem[],
  frequency: "daily" | "weekly"
): Promise<{ sent: number; failed: number }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: 0, failed: 0 };

  const resend = new Resend(apiKey);
  const db = createServerClient();

  const { data: subscribers } = await db
    .from("email_subscribers")
    .select("id, email, frequency, categories")
    .eq("is_active", true)
    .eq("frequency", frequency);

  if (!subscribers || subscribers.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const sub of subscribers as Subscriber[]) {
    // Filter items by subscriber categories
    let filteredItems = items;
    if (sub.categories.length > 0) {
      filteredItems = items.filter((i) => sub.categories.includes(i.category));
    }

    if (filteredItems.length === 0) continue;

    try {
      const period = frequency === "weekly" ? "Weekly" : "Daily";
      await resend.emails.send({
        from: "WorldScope <digest@worldscope.app>",
        to: sub.email,
        subject: `WorldScope ${period} Digest — ${filteredItems.length} events`,
        html: buildDigestHtml(filteredItems, frequency),
      });

      sent++;
      await db
        .from("email_subscribers")
        .update({ last_sent_at: new Date().toISOString() })
        .eq("id", sub.id);
    } catch {
      failed++;
    }
  }

  return { sent, failed };
}
