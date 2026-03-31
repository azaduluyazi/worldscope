/**
 * Backward-compatibility shim — re-exports from the new channels module.
 * New code should import from "@/config/channels" directly.
 */

export {
  YOUTUBE_CHANNELS,
  IPTV_CHANNELS,
  ALL_CHANNELS,
  CHANNEL_CATEGORIES,
  LIVE_WEBCAMS,
  WEBCAM_REGIONS,
  getChannelsByLocale,
  getChannelsByCountry,
  getAvailableCountries,
  getChannelsByCategory,
  sortChannelsByVariant,
  getCountryFlag,
} from "./channels";

export type {
  LiveChannel,
  LiveWebcam,
  ChannelCategory,
} from "./channels";

// Backward compat alias
import { ALL_CHANNELS } from "./channels";
export const LIVE_CHANNELS = ALL_CHANNELS;
