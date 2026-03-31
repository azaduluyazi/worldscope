/**
 * Email templates for WorldScope — free daily intelligence digest.
 * All subscribers receive categorized daily news via Resend.
 */

import type { IntelItem } from "@/types/intel";
import type { Anomaly } from "@/lib/utils/anomaly-detection";

// ─── Category definitions for email sections ──────────────────

interface EmailCategory {
  id: string;
  label: string;
  icon: string;
  accent: string;
  /** IntelItem.category values that map to this email section */
  match: string[];
}

const EMAIL_CATEGORIES: EmailCategory[] = [
  { id: "conflict", label: "Conflict & Security", icon: "🔴", accent: "#ff4757", match: ["conflict", "military", "terrorism"] },
  { id: "diplomacy", label: "Diplomacy & Politics", icon: "🏛️", accent: "#8a5cf6", match: ["diplomacy", "politics", "sanctions", "protest"] },
  { id: "finance", label: "Finance & Markets", icon: "💰", accent: "#ffd000", match: ["finance", "economy", "markets", "trade", "commodity"] },
  { id: "cyber", label: "Cybersecurity", icon: "🔒", accent: "#ff6b35", match: ["cyber", "hacking", "data-breach"] },
  { id: "tech", label: "Technology", icon: "💻", accent: "#00b4d8", match: ["tech", "ai", "space", "science"] },
  { id: "weather", label: "Weather & Natural", icon: "🌦️", accent: "#48cae4", match: ["natural", "weather", "earthquake", "climate"] },
  { id: "aviation", label: "Aviation & Transport", icon: "✈️", accent: "#0096c7", match: ["aviation", "maritime", "transport", "tracking"] },
  { id: "energy", label: "Energy", icon: "⚡", accent: "#06d6a0", match: ["energy", "oil", "nuclear", "radiation"] },
  { id: "health", label: "Health", icon: "🏥", accent: "#ef476f", match: ["health", "pandemic", "disease"] },
  { id: "sports", label: "Sports", icon: "⚽", accent: "#00ff88", match: ["sports"] },
  { id: "other", label: "Other News", icon: "📰", accent: "#4a9eff", match: [] }, // catch-all
];

function categorizeItems(items: IntelItem[]): Map<EmailCategory, IntelItem[]> {
  const result = new Map<EmailCategory, IntelItem[]>();
  const other = EMAIL_CATEGORIES[EMAIL_CATEGORIES.length - 1];

  for (const item of items) {
    const cat = item.category?.toLowerCase() || "";
    let matched = false;
    for (const ec of EMAIL_CATEGORIES) {
      if (ec.id === "other") continue;
      if (ec.match.some((m) => cat.includes(m))) {
        const list = result.get(ec) || [];
        list.push(item);
        result.set(ec, list);
        matched = true;
        break;
      }
    }
    if (!matched) {
      const list = result.get(other) || [];
      list.push(item);
      result.set(other, list);
    }
  }

  return result;
}

function severityColor(sev: string): string {
  switch (sev) {
    case "critical": return "#ff4757";
    case "high": return "#ffd000";
    case "medium": return "#00e5ff";
    case "low": return "#00ff88";
    default: return "#8a5cf6";
  }
}

function severityDot(sev: string): string {
  return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${severityColor(sev)};margin-right:6px;vertical-align:middle;"></span>`;
}

// ─── Template builder ─────────────────────────────────────────

/**
 * Daily briefing email — ALL news categorized into sections.
 */
export function buildDailyBriefingEmail(params: {
  items: IntelItem[];
  aiSummary: string;
  anomalies: Anomaly[];
  stats: { total: number; critical: number; high: number; sources: number };
  date: string;
}): { subject: string; html: string } {
  const { items, aiSummary, anomalies, stats, date } = params;

  const categorized = categorizeItems(items);

  // Build category sections
  let sectionsHtml = "";
  for (const [cat, catItems] of categorized) {
    if (catItems.length === 0) continue;

    // Sort by severity within category
    const sorted = [...catItems].sort((a, b) => {
      const order = ["critical", "high", "medium", "low", "info"];
      return order.indexOf(a.severity) - order.indexOf(b.severity);
    });

    const itemsHtml = sorted.slice(0, 25).map((item) => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #111d2e;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
            <td style="width:20px;vertical-align:top;padding-top:3px;">${severityDot(item.severity)}</td>
            <td>
              <a href="${item.url || "https://troiamedia.com"}" style="color:#e2e8f0;text-decoration:none;font-size:13px;line-height:1.4;" target="_blank">${escapeHtml(item.title)}</a>
              <div style="font-size:10px;color:#4a5568;margin-top:2px;">
                ${escapeHtml(item.source)}${item.countryCode ? ` · ${escapeHtml(item.countryCode)}` : ""}
              </div>
            </td>
            <td style="width:55px;vertical-align:top;text-align:right;">
              <span style="font-size:9px;color:${severityColor(item.severity)};text-transform:uppercase;font-weight:600;">${item.severity}</span>
            </td>
          </tr></table>
        </td>
      </tr>
    `).join("");

    sectionsHtml += `
      <!-- ${cat.label} -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
        <tr>
          <td style="background:linear-gradient(90deg, ${cat.accent}22, transparent);border-left:3px solid ${cat.accent};padding:10px 14px;">
            <span style="font-size:15px;margin-right:6px;">${cat.icon}</span>
            <span style="font-size:13px;font-weight:700;color:${cat.accent};text-transform:uppercase;letter-spacing:0.5px;">${cat.label}</span>
            <span style="font-size:11px;color:#4a5568;margin-left:8px;">(${catItems.length})</span>
          </td>
        </tr>
        ${itemsHtml}
      </table>
    `;
  }

  // Anomalies section
  const anomalyHtml = anomalies.length > 0
    ? `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
        <tr><td style="background:#1a0a0a;border:1px solid #ff4757;border-radius:6px;padding:14px;">
          <div style="color:#ff4757;font-size:12px;font-weight:700;margin-bottom:8px;">⚠ ANOMALIES DETECTED</div>
          ${anomalies.slice(0, 5).map((a) => `<div style="color:#e2e8f0;font-size:11px;margin:4px 0;">• ${escapeHtml(a.description)}</div>`).join("")}
        </td></tr>
      </table>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>WorldScope Daily Briefing</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#050a12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#050a12;">
    <tr><td align="center" style="padding:20px 10px;">

      <!-- Main Container -->
      <table cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;background:#0a1628;border:1px solid #1a2332;border-radius:10px;overflow:hidden;">

        <!-- Header Banner -->
        <tr><td style="background:linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%);padding:28px 24px;border-bottom:2px solid #00e5ff;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td>
                <div style="font-size:11px;color:#00e5ff;letter-spacing:3px;font-weight:600;margin-bottom:4px;">◆ WORLDSCOPE</div>
                <div style="font-size:22px;color:#e2e8f0;font-weight:700;line-height:1.2;">Daily Intelligence Briefing</div>
                <div style="font-size:12px;color:#4a5568;margin-top:6px;">${date} UTC · troiamedia.com</div>
              </td>
              <td style="width:60px;text-align:right;vertical-align:top;">
                <div style="width:48px;height:48px;border-radius:50%;border:2px solid #00e5ff33;display:inline-block;text-align:center;line-height:48px;font-size:20px;">🌐</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Stats Bar -->
        <tr><td style="padding:16px 24px;background:#0d1b2a;border-bottom:1px solid #1a2332;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td align="center" style="padding:6px 0;">
                <table cellpadding="0" cellspacing="0" border="0"><tr>
                  <td style="padding:0 12px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;color:#00e5ff;">${stats.total}</div>
                    <div style="font-size:9px;color:#4a5568;text-transform:uppercase;letter-spacing:1px;">Events</div>
                  </td>
                  <td style="width:1px;background:#1a2332;"></td>
                  <td style="padding:0 12px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;color:#ff4757;">${stats.critical}</div>
                    <div style="font-size:9px;color:#4a5568;text-transform:uppercase;letter-spacing:1px;">Critical</div>
                  </td>
                  <td style="width:1px;background:#1a2332;"></td>
                  <td style="padding:0 12px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;color:#ffd000;">${stats.high}</div>
                    <div style="font-size:9px;color:#4a5568;text-transform:uppercase;letter-spacing:1px;">High</div>
                  </td>
                  <td style="width:1px;background:#1a2332;"></td>
                  <td style="padding:0 12px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;color:#00ff88;">${stats.sources}</div>
                    <div style="font-size:9px;color:#4a5568;text-transform:uppercase;letter-spacing:1px;">Sources</div>
                  </td>
                </tr></table>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Content Area -->
        <tr><td style="padding:24px;">

          ${anomalyHtml}

          <!-- AI Summary -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
            <tr><td style="background:#0d1b2a;border:1px solid #1a2332;border-radius:8px;padding:16px;">
              <div style="font-size:11px;color:#00e5ff;font-weight:700;letter-spacing:1px;margin-bottom:10px;">🤖 AI SITUATION ASSESSMENT</div>
              <div style="font-size:13px;color:#cbd5e1;line-height:1.7;">${aiSummary.replace(/\n/g, "<br/>")}</div>
            </td></tr>
          </table>

          <!-- Categorized News Sections -->
          ${sectionsHtml}

          <!-- CTA Button -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px;">
            <tr><td align="center" style="padding:16px 0;">
              <a href="https://troiamedia.com" style="display:inline-block;background:#00e5ff;color:#050a12;font-size:13px;font-weight:700;padding:12px 32px;border-radius:6px;text-decoration:none;letter-spacing:0.5px;" target="_blank">
                VIEW FULL DASHBOARD →
              </a>
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 24px;border-top:1px solid #1a2332;background:#080e1a;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td align="center">
              <div style="font-size:11px;color:#00e5ff;font-weight:600;margin-bottom:6px;">◆ WORLDSCOPE</div>
              <div style="font-size:10px;color:#4a5568;line-height:1.6;">
                Global Intelligence Platform · <a href="https://troiamedia.com" style="color:#4a9eff;text-decoration:none;">troiamedia.com</a><br/>
                <a href="https://troiamedia.com/api/newsletter/unsubscribe?email={{EMAIL}}" style="color:#4a5568;text-decoration:underline;">Unsubscribe</a>
              </div>
            </td></tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return {
    subject: `[WorldScope] Daily Briefing — ${stats.critical} Critical, ${stats.total} Events — ${date}`,
    html,
  };
}

// ─── Breaking Alert (kept as-is, works fine) ──────────────────

/**
 * Breaking alert email — immediate notification for critical events.
 */
export function buildBreakingAlertEmail(params: {
  item: IntelItem;
  timestamp: string;
}): { subject: string; html: string } {
  const { item, timestamp } = params;
  const borderColor = item.severity === "critical" ? "#ff4757" : "#ffd000";
  const sevLabel = item.severity.toUpperCase();

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050a12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#050a12;">
    <tr><td align="center" style="padding:20px 10px;">
      <table cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;background:#0a1628;border:1px solid #1a2332;border-radius:10px;">
        <tr><td style="padding:24px;border-bottom:2px solid ${borderColor};">
          <div style="font-size:11px;color:#00e5ff;letter-spacing:3px;font-weight:600;">◆ WORLDSCOPE</div>
          <div style="font-size:12px;color:${borderColor};font-weight:700;margin-top:6px;">⚡ BREAKING ALERT</div>
        </td></tr>
        <tr><td style="padding:24px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td style="border-left:3px solid ${borderColor};padding:12px 16px;background:#0d1b2a;border-radius:0 6px 6px 0;">
              <div style="font-size:10px;margin-bottom:8px;">
                <span style="color:${borderColor};font-weight:700;">${sevLabel}</span>
                <span style="color:#4a5568;margin:0 4px;">—</span>
                <span style="color:#4a5568;">${escapeHtml(item.category)}</span>
                <span style="color:#4a5568;float:right;">${timestamp}</span>
              </div>
              <div style="font-size:16px;color:#e2e8f0;line-height:1.4;font-weight:700;">${escapeHtml(item.title)}</div>
              ${item.summary ? `<div style="font-size:12px;color:#94a3b8;margin-top:10px;line-height:1.5;">${escapeHtml(item.summary.slice(0, 300))}</div>` : ""}
              <div style="font-size:10px;color:#4a5568;margin-top:10px;">Source: ${escapeHtml(item.source)}</div>
            </td></tr>
          </table>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:20px;">
            <tr><td align="center">
              <a href="${item.url || "https://troiamedia.com"}" style="display:inline-block;background:${borderColor};color:#050a12;font-size:12px;font-weight:700;padding:10px 28px;border-radius:6px;text-decoration:none;" target="_blank">READ FULL REPORT →</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #1a2332;text-align:center;">
          <div style="font-size:10px;color:#4a5568;">
            <a href="https://troiamedia.com" style="color:#4a9eff;text-decoration:none;">troiamedia.com</a> ·
            <a href="https://troiamedia.com/api/newsletter/unsubscribe?email={{EMAIL}}" style="color:#4a5568;text-decoration:underline;">Unsubscribe</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return {
    subject: `⚡ [${sevLabel}] ${item.title.slice(0, 80)}`,
    html,
  };
}

// ─── Weekly Report (kept, minor cleanup) ──────────────────────

/**
 * Weekly report email — trend analysis + top events.
 */
export function buildWeeklyReportEmail(params: {
  items: IntelItem[];
  aiAnalysis: string;
  stats: { total: number; critical: number; high: number; sources: number; topCategories: string[] };
  weekRange: string;
}): { subject: string; html: string } {
  const { items, aiAnalysis, stats, weekRange } = params;

  const categorized = categorizeItems(items);
  let sectionsHtml = "";
  for (const [cat, catItems] of categorized) {
    if (catItems.length === 0) continue;
    const sorted = [...catItems].sort((a, b) => {
      const order = ["critical", "high", "medium", "low", "info"];
      return order.indexOf(a.severity) - order.indexOf(b.severity);
    });
    const itemsHtml = sorted.slice(0, 10).map((item) => `
      <tr><td style="padding:5px 10px;border-bottom:1px solid #111d2e;">
        ${severityDot(item.severity)}
        <a href="${item.url || "#"}" style="color:#e2e8f0;text-decoration:none;font-size:12px;" target="_blank">${escapeHtml(item.title)}</a>
        <span style="font-size:9px;color:#4a5568;margin-left:6px;">${escapeHtml(item.source)}</span>
      </td></tr>
    `).join("");

    sectionsHtml += `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;">
        <tr><td style="border-left:3px solid ${cat.accent};padding:8px 12px;background:#0d1b2a22;">
          <span style="font-size:14px;margin-right:4px;">${cat.icon}</span>
          <span style="font-size:12px;font-weight:700;color:${cat.accent};">${cat.label}</span>
          <span style="font-size:10px;color:#4a5568;margin-left:6px;">(${catItems.length})</span>
        </td></tr>
        ${itemsHtml}
      </table>`;
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050a12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#050a12;">
    <tr><td align="center" style="padding:20px 10px;">
      <table cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;background:#0a1628;border:1px solid #1a2332;border-radius:10px;">
        <tr><td style="padding:24px;border-bottom:2px solid #00e5ff;">
          <div style="font-size:11px;color:#00e5ff;letter-spacing:3px;font-weight:600;">◆ WORLDSCOPE</div>
          <div style="font-size:20px;color:#e2e8f0;font-weight:700;margin-top:6px;">Weekly Intelligence Report</div>
          <div style="font-size:12px;color:#4a5568;margin-top:4px;">${weekRange}</div>
        </td></tr>
        <tr><td style="padding:24px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
            <tr><td style="background:#0d1b2a;border:1px solid #1a2332;border-radius:8px;padding:14px;">
              <div style="font-size:11px;color:#00e5ff;font-weight:700;margin-bottom:8px;">🤖 WEEKLY ANALYSIS</div>
              <div style="font-size:12px;color:#cbd5e1;line-height:1.6;">${aiAnalysis.replace(/\n/g, "<br/>")}</div>
            </td></tr>
          </table>
          ${sectionsHtml}
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td align="center" style="padding:16px 0;">
              <a href="https://troiamedia.com" style="display:inline-block;background:#00e5ff;color:#050a12;font-size:12px;font-weight:700;padding:10px 28px;border-radius:6px;text-decoration:none;" target="_blank">VIEW FULL DASHBOARD →</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #1a2332;text-align:center;">
          <div style="font-size:10px;color:#4a5568;">
            <a href="https://troiamedia.com" style="color:#4a9eff;text-decoration:none;">troiamedia.com</a> ·
            <a href="https://troiamedia.com/api/newsletter/unsubscribe?email={{EMAIL}}" style="color:#4a5568;text-decoration:underline;">Unsubscribe</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return {
    subject: `[WorldScope] Weekly Report — ${stats.total} Events, ${stats.critical} Critical — ${weekRange}`,
    html,
  };
}

// ─── Utilities ────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
