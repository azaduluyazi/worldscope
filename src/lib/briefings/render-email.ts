/**
 * Render a subscriber's daily/weekly briefing as HTML.
 *
 * Markdown → HTML inline (no external deps) since the country briefings
 * are guaranteed to be a small, bounded markdown subset (bullets, bold,
 * headings) produced by our own model.
 *
 * Keeps the payload under 100kb for Gmail's clip threshold even when
 * all 5 countries have busy days. Design mirrors the WorldScope HUD
 * aesthetic — dark panel, amber accent, monospace header — in email
 * client-compatible inline styles.
 */

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ff4757",
  high: "#ff7e3e",
  medium: "#ffd000",
  low: "#00e5ff",
  info: "#00ff88",
};

export interface CountrySection {
  country_code: string;
  /** Display label — e.g. "Türkiye". */
  country_name: string;
  /** Briefing markdown from public.country_briefings.content */
  content: string;
  /** Roll-up severity. */
  top_severity: string | null;
  /** Event count for the 24h window. */
  event_count: number;
}

export interface BriefingEmailProps {
  kind: "daily" | "weekly";
  date: string; // YYYY-MM-DD — "week ending" for weekly
  recipient_name: string;
  countries: CountrySection[];
  /** Link users click to change countries/frequency. */
  preferences_url: string;
  /** One-click opt-out URL with ?token=xxx. */
  unsubscribe_url: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Minimal markdown → HTML. Handles: ## headings, bullets (`- `), bold
 * `**...**`, inline links `[text](url)`. Anything else passes through
 * escaped. Good enough for our model's constrained output.
 */
function markdownToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const html: string[] = [];
  let inList = false;

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      continue;
    }

    // Bullet
    if (line.startsWith("- ")) {
      if (!inList) {
        html.push(`<ul style="margin:6px 0 12px 18px;padding:0;color:#c5bfae;">`);
        inList = true;
      }
      html.push(
        `<li style="margin:4px 0;line-height:1.45;font-size:13px;">${inlineFormat(
          line.slice(2),
        )}</li>`,
      );
      continue;
    }

    // Close any open list before a non-list line
    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    // Heading
    if (line.startsWith("## ")) {
      html.push(
        `<h3 style="margin:14px 0 4px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#f5a524;font-family:'JetBrains Mono',monospace;">${inlineFormat(
          line.slice(3),
        )}</h3>`,
      );
      continue;
    }

    html.push(
      `<p style="margin:6px 0;line-height:1.5;font-size:13px;color:#c5bfae;">${inlineFormat(
        line,
      )}</p>`,
    );
  }

  if (inList) html.push("</ul>");
  return html.join("\n");
}

function inlineFormat(line: string): string {
  let out = escapeHtml(line);
  // Links [text](url)
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_m, text, url) =>
      `<a href="${url}" style="color:#f5a524;text-decoration:none;">${text}</a>`,
  );
  // Bold **...**
  out = out.replace(
    /\*\*([^*]+)\*\*/g,
    (_m, body) => `<strong style="color:#f1ede3;">${body}</strong>`,
  );
  return out;
}

export function renderBriefingEmail(props: BriefingEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const { kind, date, recipient_name, countries, preferences_url, unsubscribe_url } =
    props;

  const countryLabels = countries.map((c) => c.country_name).join(" · ");
  const subject =
    kind === "daily"
      ? `WorldScope · ${countryLabels} · ${date}`
      : `WorldScope Weekly · ${countryLabels} · week ending ${date}`;

  const header = `
    <tr><td style="padding:24px 32px 0;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#f5a524;">
        WORLDSCOPE ${kind === "daily" ? "DAILY" : "WEEKLY"} BRIEFING
      </div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#6b6458;margin-top:2px;">
        ${date} · ${countries.length} ${countries.length === 1 ? "country" : "countries"} · ${countries.reduce((n, c) => n + c.event_count, 0)} events
      </div>
      <h1 style="margin:18px 0 6px;color:#f1ede3;font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;">
        Hello ${escapeHtml(recipient_name)},
      </h1>
      <p style="margin:0 0 22px;font-size:13px;line-height:1.5;color:#c5bfae;">
        Your ${kind} intelligence roll-up for ${countryLabels}.
      </p>
    </td></tr>
  `;

  const sections = countries
    .map((c) => {
      const sevColor = c.top_severity ? SEVERITY_COLORS[c.top_severity] : "#6b6458";
      return `
        <tr><td style="padding:0 32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #2d2a24;border-radius:3px;background:#0a0810;">
            <tr><td style="padding:16px 18px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="font-family:'JetBrains Mono',monospace;font-size:14px;color:#f5a524;font-weight:700;letter-spacing:0.08em;">
                  ${escapeHtml(c.country_name.toUpperCase())}
                </div>
                <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:${sevColor};text-transform:uppercase;">
                  ${c.top_severity ?? "—"} · ${c.event_count} events
                </div>
              </div>
              ${markdownToHtml(c.content)}
            </td></tr>
          </table>
        </td></tr>
      `;
    })
    .join("");

  const footer = `
    <tr><td style="padding:8px 32px 24px;font-family:'JetBrains Mono',monospace;font-size:10px;color:#6b6458;line-height:1.6;">
      <hr style="border:0;border-top:1px solid #2d2a24;margin:16px 0;" />
      <p style="margin:4px 0;">
        You receive this because you subscribed to WorldScope Gaia.
      </p>
      <p style="margin:4px 0;">
        <a href="${preferences_url}" style="color:#f5a524;text-decoration:none;">Change preferences</a>
        &nbsp;·&nbsp;
        <a href="${unsubscribe_url}" style="color:#f5a524;text-decoration:none;">Unsubscribe</a>
        &nbsp;·&nbsp;
        <a href="https://troiamedia.com" style="color:#f5a524;text-decoration:none;">troiamedia.com</a>
      </p>
      <p style="margin:12px 0 0;color:#4a473f;">
        TroiaMedia · Real-time global intelligence · 689 sources · 195 countries
      </p>
    </td></tr>
  `;

  const html = `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#060509;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','JetBrains Mono',monospace;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#060509;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="background:#0d0b12;border:1px solid #2d2a24;border-radius:4px;max-width:100%;">
        ${header}
        ${sections}
        ${footer}
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = countries
    .map(
      (c) =>
        `${c.country_name.toUpperCase()} — ${c.top_severity ?? "—"} · ${c.event_count} events\n${c.content}\n`,
    )
    .join("\n---\n\n") +
    `\n\nChange preferences: ${preferences_url}\nUnsubscribe: ${unsubscribe_url}`;

  return { subject, html, text };
}
