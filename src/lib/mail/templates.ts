/**
 * Email templates for WorldScope — daily intelligence digest.
 * Pulls from events DB + Redis seed data (market, natural, convergence, radiation).
 */

import type { IntelItem } from "@/types/intel";
import type { Anomaly } from "@/lib/utils/anomaly-detection";
import type { MarketQuote } from "@/types/market";
import type { Convergence } from "@/lib/convergence/types";

// ─── Types for enriched briefing data ───────────────────

export interface WeatherAlert {
  city: string;
  country: string;
  temperature: number;
  windSpeed: number;
  weatherCode: number;
  weatherLabel: string;
  isExtreme: boolean;
}

export interface Earthquake {
  mag: number;
  place: string;
  time: number;
  lat: number;
  lng: number;
  depth?: number;
}

export interface BriefingData {
  items: IntelItem[];
  aiSummary: string;
  anomalies: Anomaly[];
  stats: { total: number; critical: number; high: number; sources: number };
  date: string;
  // Enriched seed data (all optional — mail works even if some are unavailable)
  marketQuotes?: MarketQuote[];
  cryptoQuotes?: MarketQuote[];
  fearGreed?: { value: number; classification: string };
  earthquakes?: Earthquake[];
  weather?: WeatherAlert[];
  convergences?: Convergence[];
  radiationAlerts?: number; // count of elevated readings
}

// ─── Category definitions for email sections ──────────────────

interface EmailCategory {
  id: string;
  label: string;
  icon: string;
  accent: string;
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
  { id: "other", label: "Other News", icon: "📰", accent: "#4a9eff", match: [] },
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

// ─── Market Section Builder ─────────────────────────────

function buildMarketSection(quotes?: MarketQuote[], crypto?: MarketQuote[], fearGreed?: { value: number; classification: string }): string {
  if (!quotes?.length && !crypto?.length && !fearGreed) return "";

  const arrow = (pct: number) => pct >= 0 ? "▲" : "▼";
  const color = (pct: number) => pct >= 0 ? "#00ff88" : "#ff4757";
  const fmt = (n: number) => n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : n.toFixed(2);

  // Key market indices
  const keyQuotes = (quotes || []).slice(0, 4);
  const keyCrypto = (crypto || []).slice(0, 4);

  let quoteRows = "";
  for (const q of keyQuotes) {
    quoteRows += `
      <td style="padding:6px 8px;text-align:center;width:25%;">
        <div style="font-size:10px;color:#4a5568;margin-bottom:2px;">${escapeHtml(q.symbol)}</div>
        <div style="font-size:14px;color:#e2e8f0;font-weight:700;">$${fmt(q.price)}</div>
        <div style="font-size:10px;color:${color(q.changePct)};font-weight:600;">${arrow(q.changePct)} ${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%</div>
      </td>`;
  }

  let cryptoRows = "";
  for (const c of keyCrypto) {
    cryptoRows += `
      <td style="padding:6px 8px;text-align:center;width:25%;">
        <div style="font-size:10px;color:#4a5568;margin-bottom:2px;">${escapeHtml(c.symbol)}</div>
        <div style="font-size:14px;color:#e2e8f0;font-weight:700;">$${fmt(c.price)}</div>
        <div style="font-size:10px;color:${color(c.changePct)};font-weight:600;">${arrow(c.changePct)} ${c.changePct >= 0 ? "+" : ""}${c.changePct.toFixed(2)}%</div>
      </td>`;
  }

  // Fear & Greed gauge
  let fgHtml = "";
  if (fearGreed) {
    const fgColor = fearGreed.value <= 25 ? "#ff4757" : fearGreed.value <= 45 ? "#ffd000" : fearGreed.value <= 55 ? "#4a5568" : fearGreed.value <= 75 ? "#00e5ff" : "#00ff88";
    fgHtml = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:10px;">
        <tr><td style="padding:8px 12px;background:#0a1628;border-radius:6px;text-align:center;">
          <span style="font-size:10px;color:#4a5568;">Fear & Greed Index: </span>
          <span style="font-size:16px;font-weight:700;color:${fgColor};">${fearGreed.value}</span>
          <span style="font-size:10px;color:${fgColor};margin-left:4px;">${escapeHtml(fearGreed.classification)}</span>
        </td></tr>
      </table>`;
  }

  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
      <tr><td style="background:linear-gradient(90deg, #ffd00022, transparent);border-left:3px solid #ffd000;padding:10px 14px;">
        <span style="font-size:15px;margin-right:6px;">📊</span>
        <span style="font-size:13px;font-weight:700;color:#ffd000;text-transform:uppercase;letter-spacing:0.5px;">MARKET SNAPSHOT</span>
      </td></tr>
      <tr><td style="padding:12px 8px;">
        ${keyQuotes.length > 0 ? `
          <div style="font-size:10px;color:#4a5568;padding:0 8px 4px;text-transform:uppercase;letter-spacing:0.5px;">Indices & Commodities</div>
          <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>${quoteRows}</tr></table>
        ` : ""}
        ${keyCrypto.length > 0 ? `
          <div style="font-size:10px;color:#4a5568;padding:10px 8px 4px;text-transform:uppercase;letter-spacing:0.5px;">Crypto</div>
          <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>${cryptoRows}</tr></table>
        ` : ""}
        ${fgHtml}
      </td></tr>
    </table>`;
}

// ─── Earthquake Section Builder ─────────────────────────

function buildEarthquakeSection(quakes?: Earthquake[]): string {
  if (!quakes?.length) return "";

  // Show significant quakes (mag >= 4.0) sorted by magnitude
  const significant = quakes
    .filter((q) => q.mag >= 4.0)
    .sort((a, b) => b.mag - a.mag)
    .slice(0, 5);

  if (significant.length === 0) return "";

  const magColor = (mag: number) => mag >= 6 ? "#ff4757" : mag >= 5 ? "#ffd000" : "#00e5ff";

  const rows = significant.map((q) => `
    <tr><td style="padding:5px 10px;border-bottom:1px solid #111d2e;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td style="width:50px;text-align:center;">
          <span style="font-size:16px;font-weight:700;color:${magColor(q.mag)};">${q.mag.toFixed(1)}</span>
        </td>
        <td>
          <div style="font-size:12px;color:#e2e8f0;">${escapeHtml(q.place)}</div>
          <div style="font-size:9px;color:#4a5568;">${new Date(q.time).toISOString().slice(0, 16).replace("T", " ")} UTC${q.depth ? ` · Depth: ${q.depth.toFixed(0)}km` : ""}</div>
        </td>
      </tr></table>
    </td></tr>
  `).join("");

  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
      <tr><td style="background:linear-gradient(90deg, #48cae422, transparent);border-left:3px solid #48cae4;padding:10px 14px;">
        <span style="font-size:15px;margin-right:6px;">🌍</span>
        <span style="font-size:13px;font-weight:700;color:#48cae4;text-transform:uppercase;letter-spacing:0.5px;">SEISMIC ACTIVITY</span>
        <span style="font-size:11px;color:#4a5568;margin-left:8px;">(${quakes.length} total, ${significant.length} significant)</span>
      </td></tr>
      ${rows}
    </table>`;
}

// ─── Weather Section Builder ────────────────────────────

function buildWeatherSection(alerts?: WeatherAlert[]): string {
  if (!alerts?.length) return "";

  const extreme = alerts.filter((w) => w.isExtreme);
  if (extreme.length === 0) {
    // Show compact global weather summary even without extremes
    const rows = alerts.slice(0, 6).map((w) => `
      <td style="padding:4px 6px;text-align:center;width:${Math.floor(100 / Math.min(alerts.length, 6))}%;">
        <div style="font-size:10px;color:#4a5568;">${escapeHtml(w.city)}</div>
        <div style="font-size:14px;color:#e2e8f0;font-weight:600;">${w.temperature}°</div>
        <div style="font-size:9px;color:#64748b;">${escapeHtml(w.weatherLabel)}</div>
      </td>
    `).join("");

    return `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
        <tr><td style="background:linear-gradient(90deg, #48cae422, transparent);border-left:3px solid #48cae4;padding:10px 14px;">
          <span style="font-size:15px;margin-right:6px;">🌡️</span>
          <span style="font-size:13px;font-weight:700;color:#48cae4;text-transform:uppercase;letter-spacing:0.5px;">GLOBAL WEATHER</span>
        </td></tr>
        <tr><td style="padding:10px 4px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>${rows}</tr></table>
        </td></tr>
      </table>`;
  }

  // Extreme weather alerts
  const rows = extreme.map((w) => `
    <tr><td style="padding:5px 10px;border-bottom:1px solid #111d2e;">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ff4757;margin-right:6px;vertical-align:middle;"></span>
      <span style="font-size:12px;color:#e2e8f0;font-weight:600;">${escapeHtml(w.city)}, ${escapeHtml(w.country)}</span>
      <span style="font-size:11px;color:#ff4757;margin-left:8px;">${w.temperature}° · ${escapeHtml(w.weatherLabel)}</span>
      ${w.windSpeed > 60 ? `<span style="font-size:10px;color:#ffd000;margin-left:6px;">Wind: ${w.windSpeed} km/h</span>` : ""}
    </td></tr>
  `).join("");

  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
      <tr><td style="background:linear-gradient(90deg, #ff475722, transparent);border-left:3px solid #ff4757;padding:10px 14px;">
        <span style="font-size:15px;margin-right:6px;">⚠️</span>
        <span style="font-size:13px;font-weight:700;color:#ff4757;text-transform:uppercase;letter-spacing:0.5px;">EXTREME WEATHER ALERTS</span>
        <span style="font-size:11px;color:#4a5568;margin-left:8px;">(${extreme.length})</span>
      </td></tr>
      ${rows}
    </table>`;
}

// ─── Convergence Section Builder ────────────────────────

function buildConvergenceSection(convergences?: Convergence[]): string {
  if (!convergences?.length) return "";

  const highConf = convergences.filter((c) => c.confidence >= 0.6).slice(0, 3);
  if (highConf.length === 0) return "";

  const typeLabel: Record<string, string> = {
    geopolitical: "Geopolitical",
    economic_cascade: "Economic Cascade",
    cyber_infrastructure: "Cyber-Infrastructure",
    humanitarian: "Humanitarian",
    environmental: "Environmental",
    multi_signal: "Multi-Signal",
  };

  const typeColor: Record<string, string> = {
    geopolitical: "#ff4757",
    economic_cascade: "#ffd000",
    cyber_infrastructure: "#ff6b35",
    humanitarian: "#ef476f",
    environmental: "#06d6a0",
    multi_signal: "#8a5cf6",
  };

  const rows = highConf.map((c) => {
    const col = typeColor[c.type] || "#4a9eff";
    const confPct = Math.round(c.confidence * 100);
    const regions = c.affectedRegions.slice(0, 3).join(", ");
    const signalCount = c.signals.length;

    return `
      <tr><td style="padding:10px;border-bottom:1px solid #111d2e;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td style="width:6px;background:${col};border-radius:3px;"></td>
          <td style="padding-left:10px;">
            <div style="font-size:12px;color:#e2e8f0;font-weight:600;">${typeLabel[c.type] || c.type} Convergence</div>
            ${c.narrative ? `<div style="font-size:11px;color:#94a3b8;margin-top:4px;line-height:1.4;">${escapeHtml(c.narrative.slice(0, 150))}${c.narrative.length > 150 ? "..." : ""}</div>` : ""}
            <div style="font-size:9px;color:#4a5568;margin-top:4px;">
              Confidence: <span style="color:${col};font-weight:600;">${confPct}%</span>
              · Signals: ${signalCount}
              ${regions ? ` · Regions: ${regions}` : ""}
            </div>
          </td>
        </tr></table>
      </td></tr>`;
  }).join("");

  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
      <tr><td style="background:linear-gradient(90deg, #8a5cf622, transparent);border-left:3px solid #8a5cf6;padding:10px 14px;">
        <span style="font-size:15px;margin-right:6px;">🔗</span>
        <span style="font-size:13px;font-weight:700;color:#8a5cf6;text-transform:uppercase;letter-spacing:0.5px;">CONVERGENCE ALERTS</span>
        <span style="font-size:11px;color:#4a5568;margin-left:8px;">(${highConf.length} active)</span>
      </td></tr>
      ${rows}
    </table>`;
}

// ─── Template builder ─────────────────────────────────────────

/**
 * Daily briefing email — enriched with market, natural, convergence data.
 */
export function buildDailyBriefingEmail(params: BriefingData): { subject: string; html: string } {
  const { items, aiSummary, anomalies, stats, date, marketQuotes, cryptoQuotes, fearGreed, earthquakes, weather, convergences, radiationAlerts } = params;

  const categorized = categorizeItems(items);

  // Build category sections
  let sectionsHtml = "";
  for (const [cat, catItems] of categorized) {
    if (catItems.length === 0) continue;

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

  // Build enriched data sections
  const marketHtml = buildMarketSection(marketQuotes, cryptoQuotes, fearGreed);
  const earthquakeHtml = buildEarthquakeSection(earthquakes);
  const weatherHtml = buildWeatherSection(weather);
  const convergenceHtml = buildConvergenceSection(convergences);

  // Radiation alert banner (only if elevated)
  const radiationHtml = radiationAlerts && radiationAlerts > 0
    ? `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
        <tr><td style="background:#1a0a0a;border:1px solid #ffd000;border-radius:6px;padding:12px 14px;">
          <span style="font-size:13px;margin-right:6px;">☢️</span>
          <span style="font-size:12px;color:#ffd000;font-weight:700;">RADIATION ALERT</span>
          <span style="font-size:11px;color:#e2e8f0;margin-left:8px;">${radiationAlerts} elevated reading${radiationAlerts > 1 ? "s" : ""} detected globally</span>
        </td></tr>
      </table>`
    : "";

  // Determine if we have any content at all
  const hasEvents = items.length > 0;
  const hasEnrichedData = marketHtml || earthquakeHtml || weatherHtml || convergenceHtml || radiationHtml;
  const noContentHtml = !hasEvents && !hasEnrichedData
    ? `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
        <tr><td style="background:#0d1b2a;border:1px solid #1a2332;border-radius:8px;padding:20px;text-align:center;">
          <div style="font-size:14px;color:#4a5568;margin-bottom:8px;">No significant events in the last 24 hours</div>
          <div style="font-size:12px;color:#64748b;">All systems nominal. Visit the dashboard for real-time monitoring.</div>
        </td></tr>
      </table>`
    : "";

  // Enhanced subject line
  const subjectParts = [`[WorldScope] Daily Briefing`];
  if (stats.critical > 0) subjectParts.push(`${stats.critical} Critical`);
  if (stats.total > 0) subjectParts.push(`${stats.total} Events`);
  if (convergences?.length) subjectParts.push(`${convergences.filter((c) => c.confidence >= 0.6).length} Convergences`);
  subjectParts.push(date);
  const subject = subjectParts.join(" — ");

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
          ${radiationHtml}
          ${convergenceHtml}

          <!-- AI Summary -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
            <tr><td style="background:#0d1b2a;border:1px solid #1a2332;border-radius:8px;padding:16px;">
              <div style="font-size:11px;color:#00e5ff;font-weight:700;letter-spacing:1px;margin-bottom:10px;">🤖 AI SITUATION ASSESSMENT</div>
              <div style="font-size:13px;color:#cbd5e1;line-height:1.7;">${aiSummary.replace(/\n/g, "<br/>")}</div>
            </td></tr>
          </table>

          <!-- Market Snapshot -->
          ${marketHtml}

          <!-- Natural Hazards -->
          ${earthquakeHtml}
          ${weatherHtml}

          <!-- Categorized News Sections -->
          ${sectionsHtml}

          ${noContentHtml}

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

  return { subject, html };
}

// ─── Breaking Alert (unchanged) ──────────────────────────

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

// ─── Weekly Report ──────────────────────────────────────

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

// ─── Utilities ────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
