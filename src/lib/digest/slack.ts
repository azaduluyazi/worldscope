/**
 * Slack digest adapter.
 *
 * Formats a DigestItem[] as Slack Block Kit and POSTs to an incoming-webhook
 * URL. No app install needed on the user's workspace — incoming webhooks are
 * Slack's simplest surface and match our "register a URL, get a digest"
 * model.
 *
 * Slack Block Kit reference: https://api.slack.com/block-kit
 */

import type { DigestItem, DigestMeta, DispatchResult, Severity } from "./types";

const SEVERITY_EMOJI: Record<Severity, string> = {
  critical: ":red_circle:",
  high: ":large_orange_diamond:",
  medium: ":large_yellow_circle:",
  low: ":large_green_circle:",
  info: ":white_circle:",
};

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function itemBlock(item: DigestItem) {
  const emoji = SEVERITY_EMOJI[item.severity];
  const title = truncate(item.title, 240);
  const link = item.url ? `<${item.url}|${title}>` : title;
  const metaParts = [
    item.country ? `:flag-${item.country.toLowerCase()}:` : null,
    item.source ? `_${truncate(item.source, 40)}_` : null,
    item.score != null ? `\`${item.score}\`` : null,
    item.category ? `*${item.category}*` : null,
  ].filter(Boolean);
  const summary = item.summary ? `\n> ${truncate(item.summary, 240)}` : "";
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `${emoji} ${link}${summary}\n${metaParts.join("  ·  ")}`,
    },
  };
}

export function formatSlackBlocks(items: DigestItem[], meta: DigestMeta = {}) {
  const blocks: Record<string, unknown>[] = [];
  if (meta.title) {
    blocks.push({
      type: "header",
      text: { type: "plain_text", text: truncate(meta.title, 150), emoji: true },
    });
  }
  if (meta.assessment) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Assessment.* ${truncate(meta.assessment, 2500)}` },
    });
  }
  blocks.push({ type: "divider" });

  const sliced = items.slice(0, 30); // Slack caps block count
  for (const item of sliced) {
    blocks.push(itemBlock(item));
  }

  blocks.push({ type: "divider" });
  const footerBits = [
    meta.tier ? `:crown: ${meta.tier}` : null,
    meta.brandUrl ? `<${meta.brandUrl}|troiamedia.com>` : "troiamedia.com",
  ].filter(Boolean);
  blocks.push({
    type: "context",
    elements: [
      { type: "mrkdwn", text: footerBits.join("  ·  ") },
    ],
  });

  return blocks;
}

export async function sendSlackDigest(
  webhookUrl: string,
  items: DigestItem[],
  meta: DigestMeta = {},
): Promise<DispatchResult> {
  const blocks = formatSlackBlocks(items, meta);
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
    return { channel: "slack", ok: res.ok, status: res.status };
  } catch (err) {
    return {
      channel: "slack",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
