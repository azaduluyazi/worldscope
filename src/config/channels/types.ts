/**
 * Channel types for the TV system.
 * All channels are free — no tier gating.
 */

export interface LiveChannel {
  id: string;
  label: string;
  /** YouTube channel ID (for YouTube embeds) */
  channelId?: string;
  /** Fallback: specific video ID if channel embed fails */
  videoId?: string;
  /** HLS/M3U8 direct stream URL (for non-YouTube channels) */
  hlsUrl?: string;
  /** Stream type */
  type: "youtube" | "hls";
  /** Region/language tag */
  region: "global" | "us" | "eu" | "tr" | "mideast" | "asia" | "latam" | "africa";
  /** Language code (for locale-based filtering) */
  lang: string;
  /** Country ISO code for country picker */
  country?: string;
  /** Accent color for the tab */
  color?: string;
  /** Channel category */
  category?: ChannelCategory;
  /** Variant affinity — which dashboard variants prioritize this channel */
  variantAffinity?: string[];
}

export type ChannelCategory =
  | "all"
  | "news"
  | "business"
  | "sports"
  | "documentary"
  | "entertainment"
  | "music"
  | "kids"
  | "religious"
  | "weather"
  | "education"
  | "general";

export const CHANNEL_CATEGORIES: Array<{
  id: ChannelCategory;
  label: string;
  icon: string;
}> = [
  { id: "all", label: "ALL", icon: "📺" },
  { id: "news", label: "NEWS", icon: "📰" },
  { id: "business", label: "BIZ", icon: "💰" },
  { id: "sports", label: "SPORTS", icon: "⚽" },
  { id: "entertainment", label: "ENTERTAINMENT", icon: "🎬" },
  { id: "music", label: "MUSIC", icon: "🎵" },
  { id: "documentary", label: "DOCS", icon: "🎥" },
  { id: "kids", label: "KIDS", icon: "🧸" },
  { id: "religious", label: "RELIGIOUS", icon: "🕌" },
  { id: "weather", label: "WEATHER", icon: "🌦️" },
  { id: "education", label: "EDUCATION", icon: "📚" },
  { id: "general", label: "GENERAL", icon: "📡" },
];

export interface LiveWebcam {
  id: string;
  city: string;
  country: string;
  videoId: string;
  region: "mideast" | "europe" | "americas" | "asia" | "space";
  color: string;
}
