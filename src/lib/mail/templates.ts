/**
 * Email templates for WorldScope mail subscription.
 * Premium tier: $1/month — daily briefing + breaking alerts.
 */

import type { IntelItem } from "@/types/intel";
import type { Anomaly } from "@/lib/utils/anomaly-detection";

const LOGO_TEXT = "◆ WORLDSCOPE";
const FOOTER = `
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #1a2332;text-align:center;">
    <p style="color:#4a5568;font-size:10px;font-family:monospace;">
      ${LOGO_TEXT} — Global Intelligence Platform<br/>
      <a href="https://worldscope-two.vercel.app" style="color:#00e5ff;">worldscope-two.vercel.app</a><br/>
      <a href="https://worldscope-two.vercel.app/api/newsletter/unsubscribe?email={{EMAIL}}" style="color:#4a5568;text-decoration:underline;">Unsubscribe</a>
    </p>
  </div>
`;

const BASE_STYLE = `
  body { background:#050a12; color:#e2e8f0; font-family:'JetBrains Mono',monospace; margin:0; padding:20px; }
  .container { max-width:600px; margin:0 auto; background:#0a1628; border:1px solid #1a2332; border-radius:8px; padding:24px; }
  .header { border-bottom:1px solid #1a2332; padding-bottom:16px; margin-bottom:16px; }
  .accent { color:#00e5ff; }
  .critical { color:#ff4757; }
  .high { color:#ffd000; }
  .medium { color:#00e5ff; }
  .low { color:#00ff88; }
  .item { padding:8px 12px; border-left:3px solid; margin-bottom:8px; background:#0d1b2a; border-radius:0 4px 4px 0; }
  .stat { display:inline-block; padding:4px 12px; background:#0d1b2a; border:1px solid #1a2332; border-radius:4px; margin:4px; text-align:center; }
`;

/**
 * Daily briefing email — top intel + AI summary + stats.
 */
export function buildDailyBriefingEmail(params: {
  items: IntelItem[];
  aiSummary: string;
  anomalies: Anomaly[];
  stats: { total: number; critical: number; high: number; sources: number };
  date: string;
}): { subject: string; html: string } {
  const { items, aiSummary, anomalies, stats, date } = params;

  const topItems = items.slice(0, 15);

  const itemsHtml = topItems.map((item) => {
    const sevClass = item.severity === "critical" ? "critical" : item.severity === "high" ? "high" : item.severity === "medium" ? "medium" : "low";
    const borderColor = item.severity === "critical" ? "#ff4757" : item.severity === "high" ? "#ffd000" : item.severity === "medium" ? "#00e5ff" : "#00ff88";

    return `
      <div class="item" style="border-left-color:${borderColor};">
        <div style="font-size:10px;margin-bottom:4px;">
          <span class="${sevClass}" style="font-weight:bold;text-transform:uppercase;">${item.severity}</span>
          <span style="color:#4a5568;margin:0 4px;">—</span>
          <span style="color:#4a5568;">${item.category}</span>
          <span style="color:#4a5568;float:right;">${item.source}</span>
        </div>
        <a href="${item.url}" style="color:#e2e8f0;text-decoration:none;font-size:12px;line-height:1.4;">
          ${item.title}
        </a>
      </div>
    `;
  }).join("");

  const anomalyHtml = anomalies.length > 0
    ? `<div style="background:#1a0a0a;border:1px solid #ff4757;border-radius:4px;padding:12px;margin:16px 0;">
        <div style="color:#ff4757;font-size:11px;font-weight:bold;margin-bottom:8px;">⚠ ANOMALIES DETECTED</div>
        ${anomalies.slice(0, 3).map((a) => `<div style="color:#e2e8f0;font-size:10px;margin:4px 0;">• ${a.description} (score: ${a.score})</div>`).join("")}
      </div>`
    : "";

  const html = `
    <!DOCTYPE html>
    <html><head><style>${BASE_STYLE}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-size:14px;font-weight:bold;" class="accent">${LOGO_TEXT}</div>
          <div style="font-size:18px;color:#e2e8f0;margin-top:8px;">Daily Intelligence Briefing</div>
          <div style="font-size:10px;color:#4a5568;">${date} UTC</div>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
          <div class="stat"><div style="font-size:16px;color:#00e5ff;">${stats.total}</div><div style="font-size:8px;color:#4a5568;">EVENTS</div></div>
          <div class="stat"><div style="font-size:16px;color:#ff4757;">${stats.critical}</div><div style="font-size:8px;color:#4a5568;">CRITICAL</div></div>
          <div class="stat"><div style="font-size:16px;color:#ffd000;">${stats.high}</div><div style="font-size:8px;color:#4a5568;">HIGH</div></div>
          <div class="stat"><div style="font-size:16px;color:#00ff88;">${stats.sources}</div><div style="font-size:8px;color:#4a5568;">SOURCES</div></div>
        </div>

        ${anomalyHtml}

        <div style="background:#0d1b2a;border:1px solid #1a2332;border-radius:4px;padding:12px;margin-bottom:16px;">
          <div style="font-size:11px;color:#00e5ff;font-weight:bold;margin-bottom:8px;">AI SITUATION ASSESSMENT</div>
          <div style="font-size:11px;color:#e2e8f0;line-height:1.6;">${aiSummary.replace(/\n/g, "<br/>")}</div>
        </div>

        <div style="font-size:11px;color:#00e5ff;font-weight:bold;margin-bottom:8px;">TOP INTELLIGENCE</div>
        ${itemsHtml}

        <div style="text-align:center;margin-top:16px;">
          <a href="https://worldscope-two.vercel.app" style="display:inline-block;background:#00e5ff;color:#050a12;font-size:11px;font-weight:bold;padding:8px 24px;border-radius:4px;text-decoration:none;">
            VIEW FULL DASHBOARD →
          </a>
        </div>

        ${FOOTER}
      </div>
    </body></html>
  `;

  return {
    subject: `[WorldScope] Daily Briefing — ${stats.critical} Critical, ${stats.total} Events — ${date}`,
    html,
  };
}

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

  const html = `
    <!DOCTYPE html>
    <html><head><style>${BASE_STYLE}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-size:14px;font-weight:bold;" class="accent">${LOGO_TEXT}</div>
          <div style="font-size:10px;color:#ff4757;font-weight:bold;margin-top:4px;">⚡ BREAKING ALERT</div>
        </div>

        <div class="item" style="border-left-color:${borderColor};margin:16px 0;">
          <div style="font-size:10px;margin-bottom:6px;">
            <span style="color:${borderColor};font-weight:bold;">${sevLabel}</span>
            <span style="color:#4a5568;margin:0 4px;">—</span>
            <span style="color:#4a5568;">${item.category}</span>
            <span style="color:#4a5568;float:right;">${timestamp}</span>
          </div>
          <div style="font-size:14px;color:#e2e8f0;line-height:1.4;font-weight:bold;">
            ${item.title}
          </div>
          ${item.summary ? `<div style="font-size:11px;color:#94a3b8;margin-top:8px;line-height:1.4;">${item.summary.slice(0, 300)}</div>` : ""}
          <div style="font-size:10px;color:#4a5568;margin-top:8px;">Source: ${item.source}</div>
        </div>

        <div style="text-align:center;margin-top:16px;">
          <a href="${item.url || "https://worldscope-two.vercel.app"}" style="display:inline-block;background:${borderColor};color:#050a12;font-size:11px;font-weight:bold;padding:8px 24px;border-radius:4px;text-decoration:none;">
            READ FULL REPORT →
          </a>
        </div>

        ${FOOTER}
      </div>
    </body></html>
  `;

  return {
    subject: `⚡ [${sevLabel}] ${item.title.slice(0, 80)}`,
    html,
  };
}
