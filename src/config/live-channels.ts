/**
 * Backward-compatibility shim — re-exports from the new channels module.
 *
 * The channel data has been split into:
 * - channels/youtube-channels.ts (free tier)
 * - channels/iptv-channels.ts (premium tier)
 * - channels/webcams.ts (free tier)
 *
 * New code should import from "@/config/channels" directly.
 */

// Re-export everything from the new channel index
export {
  YOUTUBE_CHANNELS,
  CHANNEL_CATEGORIES,
  LIVE_WEBCAMS,
  WEBCAM_REGIONS,
  getChannelsByLocale,
  getChannelsByCountry,
  getAvailableCountries,
  getChannelsByCategory,
  sortChannelsByVariant,
  loadIPTVChannels,
} from "./channels";

export type {
  LiveChannel,
  LiveWebcam,
  ChannelCategory,
} from "./channels";

// Backward compat: LIVE_CHANNELS now contains only YouTube (free) channels.
// Premium IPTV channels are loaded dynamically via loadIPTVChannels().
import { YOUTUBE_CHANNELS } from "./channels";
export const LIVE_CHANNELS = YOUTUBE_CHANNELS;
