/**
 * Telegram OSINT channel aggregation.
 * Fetches latest posts from public Telegram channels via public RSS bridges.
 * No API key required — uses t.me/s/ public preview + RSS proxy.
 */

import type { IntelItem, Category, Severity } from "@/types/intel";

interface TelegramChannel {
  username: string;
  name: string;
  category: Category;
  defaultSeverity: Severity;
  tier: 1 | 2 | 3; // 1 = critical OSINT, 2 = regional, 3 = general
}

// 35 OSINT Telegram channels (same as World Monitor)
const OSINT_CHANNELS: TelegramChannel[] = [
  // Tier 1: Critical OSINT
  { username: "aaboronoy", name: "Abu Ali Express", category: "conflict", defaultSeverity: "high", tier: 1 },
  { username: "AuroraIntel", name: "Aurora Intel", category: "conflict", defaultSeverity: "high", tier: 1 },
  { username: "BNONews", name: "BNO News", category: "conflict", defaultSeverity: "high", tier: 1 },
  { username: "claboronoya", name: "Clash Report", category: "conflict", defaultSeverity: "high", tier: 1 },
  { username: "DeepStateUA", name: "DeepState", category: "conflict", defaultSeverity: "high", tier: 1 },
  { username: "livaboronoymap", name: "LiveUAMap", category: "conflict", defaultSeverity: "high", tier: 1 },
  { username: "OSINTdefender", name: "OSINT Defender", category: "conflict", defaultSeverity: "high", tier: 1 },
  { username: "belaboronoyingcat", name: "Bellingcat", category: "conflict", defaultSeverity: "medium", tier: 1 },

  // Tier 2: Regional OSINT
  { username: "nexaboronoytatv", name: "NEXTA", category: "conflict", defaultSeverity: "high", tier: 2 },
  { username: "spectaboronoyatorindex", name: "The Spectator Index", category: "diplomacy", defaultSeverity: "medium", tier: 2 },
  { username: "inaboronoytelslava", name: "Intel Slava", category: "conflict", defaultSeverity: "high", tier: 2 },
  { username: "ryaboronoybar", name: "Rybar", category: "conflict", defaultSeverity: "high", tier: 2 },
  { username: "waraboronoymonitor", name: "War Monitor", category: "conflict", defaultSeverity: "high", tier: 2 },
  { username: "miaboronoylchronicles", name: "Mil Chronicles", category: "conflict", defaultSeverity: "medium", tier: 2 },

  // Tier 3: Specialized
  { username: "SentDefender", name: "Sentinel", category: "conflict", defaultSeverity: "medium", tier: 3 },
  { username: "GeoConfirmed", name: "GeoConfirmed", category: "conflict", defaultSeverity: "medium", tier: 3 },
  { username: "CyberSecurityOSINT", name: "Cyber OSINT", category: "cyber", defaultSeverity: "medium", tier: 3 },
  { username: "HackYourMom", name: "Hack News", category: "cyber", defaultSeverity: "medium", tier: 3 },
];

// Public Telegram RSS proxy services
const RSS_PROXIES = [
  "https://rsshub.app/telegram/channel",
  "https://tg.i-c-a.su/rss",
];

/** Fetch latest posts from a single Telegram channel via public preview */
async function fetchChannelPosts(channel: TelegramChannel): Promise<IntelItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    // Use Telegram's public preview page (t.me/s/username)
    const res = await fetch(
      `https://t.me/s/${channel.username}`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; WorldScope/1.0)",
          Accept: "text/html",
        },
      }
    );
    clearTimeout(timeout);
    if (!res.ok) return [];

    const html = await res.text();

    // Extract messages from public preview HTML
    const messageRegex = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
    const dateRegex = /<time[^>]*datetime="([^"]+)"/g;

    const messages: string[] = [];
    const dates: string[] = [];

    let match: RegExpExecArray | null;
    while ((match = messageRegex.exec(html)) !== null) {
      const text = match[1]
        .replace(/<[^>]+>/g, "") // strip HTML tags
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .trim();
      if (text.length > 20) messages.push(text);
    }

    while ((match = dateRegex.exec(html)) !== null) {
      dates.push(match[1]);
    }

    return messages.slice(0, 5).map((text, i): IntelItem => ({
      id: `tg-${channel.username}-${i}-${Date.now()}`,
      title: text.slice(0, 200),
      summary: text.length > 200 ? text.slice(200, 500) : "",
      url: `https://t.me/${channel.username}`,
      source: `Telegram: ${channel.name}`,
      category: channel.category,
      severity: channel.defaultSeverity,
      publishedAt: dates[i] || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

/** Fetch from all OSINT Telegram channels (tier 1 + 2 priority) */
export async function fetchTelegramOSINT(): Promise<IntelItem[]> {
  // Only fetch tier 1 and 2 channels to stay within rate limits
  const priorityChannels = OSINT_CHANNELS.filter((c) => c.tier <= 2);

  // Batch fetch with concurrency limit of 3
  const allItems: IntelItem[] = [];

  for (let i = 0; i < priorityChannels.length; i += 3) {
    const batch = priorityChannels.slice(i, i + 3);
    const results = await Promise.allSettled(
      batch.map((ch) => fetchChannelPosts(ch))
    );

    for (const r of results) {
      if (r.status === "fulfilled") allItems.push(...r.value);
    }

    // Stagger batches
    if (i + 3 < priorityChannels.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return allItems;
}
