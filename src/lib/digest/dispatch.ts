/**
 * Multi-channel digest dispatcher.
 *
 * Given a channel config object, fans out a single digest to all enabled
 * targets in parallel. Each adapter returns a DispatchResult; the
 * overall response is the aggregate so the caller can see which
 * channels succeeded.
 */

import type { DigestItem, DigestMeta, DispatchResult } from "./types";
import { sendSlackDigest } from "./slack";
import { sendDiscordDigest } from "./discord";
import { sendTelegramDigest } from "./telegram";
import { sendGenericWebhook, type WebhookOptions } from "./webhook";

export interface ChannelConfig {
  slackWebhookUrl?: string;
  discordWebhookUrl?: string;
  telegramChatId?: string | number;
  webhook?: { url: string } & WebhookOptions;
}

export async function dispatchDigest(
  items: DigestItem[],
  meta: DigestMeta,
  channels: ChannelConfig,
): Promise<DispatchResult[]> {
  const jobs: Promise<DispatchResult>[] = [];
  if (channels.slackWebhookUrl) {
    jobs.push(sendSlackDigest(channels.slackWebhookUrl, items, meta));
  }
  if (channels.discordWebhookUrl) {
    jobs.push(sendDiscordDigest(channels.discordWebhookUrl, items, meta));
  }
  if (channels.telegramChatId != null) {
    jobs.push(sendTelegramDigest(channels.telegramChatId, items, meta));
  }
  if (channels.webhook?.url) {
    const { url, ...opts } = channels.webhook;
    jobs.push(sendGenericWebhook(url, items, meta, opts));
  }
  if (jobs.length === 0) {
    return [{ channel: "none", ok: false, error: "no channels configured" }];
  }
  return Promise.all(jobs);
}

export type { ChannelConfig as DigestChannelConfig };
