/**
 * Telegram channel posting pipeline for @worldscope_signals.
 *
 * Posts high-confidence convergence events to the public channel.
 * Rate-limited to 6 posts/hour, 30 posts/day.
 *
 * Read by: src/app/api/cron/telegram-signals/route.ts (cron)
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || "@worldscope_signals";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://troiamedia.com";

export interface TelegramSignal {
  id: string;
  variant: string;
  country?: string;
  countryFlag?: string;
  headline: string;
  sourceCount: number;
  confidence: number;
  region?: string;
  timestamp: string;
}

const VARIANT_EMOJI: Record<string, string> = {
  conflict: "⚔️",
  cyber: "🛡️",
  finance: "📊",
  weather: "🌪️",
  health: "🏥",
  energy: "⚡",
  commodity: "📦",
  sports: "⚽",
  default: "🛰️",
};

function escapeMarkdownV2(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, (m) => `\\${m}`);
}

export function formatSignal(s: TelegramSignal): string {
  const emoji = VARIANT_EMOJI[s.variant] || VARIANT_EMOJI.default;
  const flag = s.countryFlag || "";
  const url = `${SITE_URL}/events/${s.id}`;
  const briefingUrl = `${SITE_URL}/briefing`;
  const conf = Math.round(s.confidence * 100);

  // Markdown V2 — escape user-provided text
  const headline = escapeMarkdownV2(s.headline);
  const region = s.region ? escapeMarkdownV2(s.region) : "Global";
  const variant = escapeMarkdownV2(s.variant.toUpperCase());

  return `${emoji} *${variant}* ${flag}

${headline}

🔗 Sources: ${s.sourceCount} \\| Confidence: ${conf}%
📍 ${region} \\| ${escapeMarkdownV2(s.timestamp)}

[Open in WorldScope](${url}) \\| [Sunday Briefing PDF](${briefingUrl})`;
}

export function formatPinnedCTA(): string {
  return `🛰️ *The Sunday Convergence Report*

WorldScope's weekly intelligence digest \\— delivered as a free PDF every Sunday at 07:00 UTC\\.

689 sources \\| 195 countries \\| AI\\-curated convergence

Subscribe \\(free, no signup\\): [troiamedia\\.com/briefing](${SITE_URL}/briefing)`;
}

interface TelegramResponse {
  ok: boolean;
  result?: { message_id: number };
  description?: string;
}

export async function postToChannel(
  text: string,
  options: { silent?: boolean; pin?: boolean } = {},
): Promise<TelegramResponse> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { ok: false, description: "TELEGRAM_BOT_TOKEN not configured" };
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHANNEL_ID,
        text,
        parse_mode: "MarkdownV2",
        disable_web_page_preview: false,
        disable_notification: options.silent || false,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = (await res.json()) as TelegramResponse;

    if (data.ok && options.pin && data.result?.message_id) {
      await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/pinChatMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHANNEL_ID,
            message_id: data.result.message_id,
            disable_notification: true,
          }),
        },
      );
    }

    return data;
  } catch (error) {
    return {
      ok: false,
      description: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Post a single convergence signal to the channel.
 */
export async function postSignal(signal: TelegramSignal): Promise<boolean> {
  const text = formatSignal(signal);
  const res = await postToChannel(text);
  return res.ok;
}

/**
 * Pin the briefing CTA (call once per week, on Saturday evenings).
 */
export async function pinBriefingCTA(): Promise<boolean> {
  const text = formatPinnedCTA();
  const res = await postToChannel(text, { pin: true, silent: true });
  return res.ok;
}
