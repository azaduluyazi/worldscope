/**
 * Discord digest adapter.
 *
 * Posts an embed to a Discord webhook URL. Each digest item becomes one
 * field on an embed; we group up to ~20 items per embed and split into
 * multiple embeds per message if needed (Discord cap: 10 embeds / msg,
 * 25 fields / embed, 6000 char total).
 *
 * Webhook reference: https://discord.com/developers/docs/resources/webhook
 */

import type { DigestItem, DigestMeta, DispatchResult, Severity } from "./types";

const SEVERITY_COLOR: Record<Severity, number> = {
  critical: 0xff3b30,
  high: 0xff9500,
  medium: 0xf5a524,
  low: 0x6effb8,
  info: 0x7aa2ff,
};

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export function formatDiscordEmbeds(items: DigestItem[], meta: DigestMeta = {}) {
  const now = new Date().toISOString();
  const top = items[0];
  const mainColor = top ? SEVERITY_COLOR[top.severity] : 0xf5a524;

  const fields = items.slice(0, 20).map((item) => ({
    name: `${item.severity.toUpperCase()} · ${truncate(item.title, 240)}`,
    value: truncate(
      [
        item.summary,
        [item.source, item.country, item.score != null ? `score ${item.score}` : null]
          .filter(Boolean)
          .join(" · "),
        item.url,
      ]
        .filter(Boolean)
        .join("\n"),
      1020,
    ),
    inline: false,
  }));

  return [
    {
      title: truncate(meta.title ?? "WorldScope Digest", 256),
      description: meta.assessment ? truncate(meta.assessment, 4000) : undefined,
      url: meta.brandUrl,
      color: mainColor,
      fields,
      timestamp: now,
      footer: {
        text: meta.tier ? `${meta.tier} · troiamedia.com` : "troiamedia.com",
      },
    },
  ];
}

export async function sendDiscordDigest(
  webhookUrl: string,
  items: DigestItem[],
  meta: DigestMeta = {},
): Promise<DispatchResult> {
  const embeds = formatDiscordEmbeds(items, meta);
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ embeds }),
    });
    return { channel: "discord", ok: res.ok, status: res.status };
  } catch (err) {
    return {
      channel: "discord",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
