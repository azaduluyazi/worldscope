/**
 * Telegram user-facing digest adapter.
 *
 * Reuses the project's existing Telegram bot (set via TELEGRAM_BOT_TOKEN).
 * The difference vs the source-health monitor bot (`@apicontrol1_bot`) is
 * that this writes USER-FACING content to a `chat_id` the user has
 * provided us — same bot token, different target chat.
 *
 * Telegram Bot API: https://core.telegram.org/bots/api#sendmessage
 */

import type { DigestItem, DigestMeta, DispatchResult, Severity } from "./types";

const SEVERITY_ICON: Record<Severity, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🟢",
  info: "⚪",
};

function escape(s: string): string {
  // Telegram MarkdownV2 reserved chars
  return s.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export function formatTelegramMessage(items: DigestItem[], meta: DigestMeta = {}): string {
  const lines: string[] = [];
  if (meta.title) lines.push(`*${escape(truncate(meta.title, 200))}*`, "");
  if (meta.assessment) {
    lines.push(`_${escape(truncate(meta.assessment, 800))}_`, "");
  }

  for (const item of items.slice(0, 30)) {
    const icon = SEVERITY_ICON[item.severity];
    const title = escape(truncate(item.title, 180));
    const head = item.url
      ? `${icon} [${title}](${item.url})`
      : `${icon} *${title}*`;
    const meta2 = [
      item.source ? escape(item.source) : null,
      item.country ? `🌍 ${escape(item.country)}` : null,
      item.score != null ? `\\(${item.score}\\)` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    lines.push(head);
    if (item.summary) lines.push(`   ${escape(truncate(item.summary, 220))}`);
    if (meta2) lines.push(`   _${meta2}_`);
    lines.push("");
  }

  if (meta.tier) lines.push(`👑 _${escape(meta.tier)}_`);
  lines.push(`🔗 [troiamedia\\.com](${meta.brandUrl ?? "https://troiamedia.com"})`);
  return lines.join("\n");
}

export async function sendTelegramDigest(
  chatId: string | number,
  items: DigestItem[],
  meta: DigestMeta = {},
): Promise<DispatchResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { channel: "telegram", ok: false, error: "TELEGRAM_BOT_TOKEN not set" };
  }
  const text = formatTelegramMessage(items, meta);
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
      }),
    });
    return { channel: "telegram", ok: res.ok, status: res.status };
  } catch (err) {
    return {
      channel: "telegram",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
