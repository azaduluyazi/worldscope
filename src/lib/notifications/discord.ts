import type { IntelItem } from "@/types/intel";

/**
 * Send a rich embed message to a Discord webhook.
 *
 * Discord embeds support colors, fields, timestamps, and thumbnails —
 * perfect for severity-coded intelligence alerts.
 */

const SEVERITY_COLORS: Record<string, number> = {
  critical: 0xff4757, // red
  high: 0xffa502, // orange
  medium: 0xffd000, // yellow
  low: 0x00e5ff, // cyan
  info: 0x8a5cf6, // purple
};

const SEVERITY_EMOJI: Record<string, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🔵",
  info: "🟣",
};

export async function sendDiscordAlert(
  webhookUrl: string,
  events: IntelItem[]
): Promise<boolean> {
  if (!webhookUrl || events.length === 0) return false;

  try {
    const _topEvent = events[0];

    const embeds = events.slice(0, 10).map((event) => ({
      title: `${SEVERITY_EMOJI[event.severity] || "📄"} ${event.title.slice(0, 256)}`,
      description: event.summary?.slice(0, 200) || undefined,
      url: event.url || undefined,
      color: SEVERITY_COLORS[event.severity] || 0x64748b,
      fields: [
        {
          name: "Category",
          value: event.category.toUpperCase(),
          inline: true,
        },
        {
          name: "Severity",
          value: event.severity.toUpperCase(),
          inline: true,
        },
        {
          name: "Source",
          value: event.source,
          inline: true,
        },
      ],
      timestamp: event.publishedAt,
      footer: {
        text: "WorldScope Intelligence",
      },
    }));

    const payload = {
      username: "WorldScope",
      avatar_url: "https://troiamedia.com/icons/icon-192.png",
      content: `**${events.length} new intelligence event${events.length > 1 ? "s" : ""}** detected`,
      embeds: embeds.slice(0, 10), // Discord limit: 10 embeds per message
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    return res.ok;
  } catch {
    return false;
  }
}
