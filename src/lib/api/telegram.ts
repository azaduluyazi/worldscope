/**
 * Telegram Bot — Send monitoring reports to admin.
 * Used by source-health cron and alert systems.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

interface TelegramResponse {
  ok: boolean;
  description?: string;
}

/**
 * Send a message via Telegram Bot API.
 * Supports HTML parse mode for formatting.
 */
export async function sendTelegram(
  text: string,
  options?: { parseMode?: "HTML" | "Markdown"; silent?: boolean }
): Promise<boolean> {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("[Telegram] Missing BOT_TOKEN or CHAT_ID");
    return false;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: options?.parseMode ?? "HTML",
          disable_notification: options?.silent ?? false,
        }),
        signal: AbortSignal.timeout(10_000),
      }
    );

    const data: TelegramResponse = await res.json();
    if (!data.ok) {
      console.error("[Telegram] API error:", data.description);
    }
    return data.ok;
  } catch (err) {
    console.error("[Telegram] Send failed:", err);
    return false;
  }
}

/**
 * Send a long message split into chunks (Telegram 4096 char limit).
 */
export async function sendTelegramLong(text: string): Promise<boolean> {
  const MAX = 4000; // leave margin for HTML tags
  if (text.length <= MAX) return sendTelegram(text);

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= MAX) {
      chunks.push(remaining);
      break;
    }
    // Split at last newline before limit
    let splitAt = remaining.lastIndexOf("\n", MAX);
    if (splitAt <= 0) splitAt = MAX;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }

  for (const chunk of chunks) {
    const ok = await sendTelegram(chunk);
    if (!ok) return false;
    // Small delay between chunks to avoid rate limits
    await new Promise((r) => setTimeout(r, 500));
  }
  return true;
}
