/**
 * Live news broadcast channels — YouTube 24/7 live streams.
 * Channel IDs are stable; video IDs may need periodic updates.
 *
 * To find a channel's live stream:
 * https://www.youtube.com/@ChannelName/live
 * Embed: https://www.youtube.com/embed/live_stream?channel={CHANNEL_ID}
 */

export interface LiveChannel {
  id: string;
  label: string;
  /** YouTube channel ID */
  channelId: string;
  /** Fallback: specific video ID if channel embed fails */
  videoId?: string;
  /** Region/language tag */
  region: "global" | "us" | "eu" | "tr" | "mideast" | "asia" | "latam" | "africa";
  /** Language code (for locale-based filtering) */
  lang: string;
  /** Accent color for the tab */
  color?: string;
}

export const LIVE_CHANNELS: LiveChannel[] = [
  // ═══════════════════════════════════════
  // INTERNATIONAL (English)
  // ═══════════════════════════════════════
  { id: "aljazeera-en", label: "AL JAZEERA", channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg", videoId: "gCNeDWCI0vo", region: "global", lang: "en", color: "#D4AA00" },
  { id: "france24-en", label: "FRANCE 24", channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg", videoId: "h3MuIUNCCzI", region: "eu", lang: "en", color: "#00A1E4" },
  { id: "dw-en", label: "DW NEWS", channelId: "UCknLrEdhRCp1aegoMqRaCZg", videoId: "GE_SfNbYa-s", region: "eu", lang: "en", color: "#0077B6" },
  { id: "skynews", label: "SKY NEWS", channelId: "UCoMdktPbSTixAyNGwb-UYkQ", videoId: "9Auq9mYxFEE", region: "global", lang: "en", color: "#C41230" },
  { id: "euronews-en", label: "EURONEWS", channelId: "UCW2QcKZiU8aUGg4yxCIditg", videoId: "pykpO5kQJ98", region: "eu", lang: "en", color: "#003DA6" },
  { id: "cnbc", label: "CNBC", channelId: "UCvJJ_dzjViJCoLf5uKUTwoA", videoId: "9NyxcX3rhQs", region: "us", lang: "en", color: "#005594" },
  { id: "bloomberg", label: "BLOOMBERG", channelId: "UCIALMKvObZNtJ68-rmLjXoA", videoId: "oPmFnOCSLyA", region: "us", lang: "en", color: "#2800D7" },
  { id: "trtworld", label: "TRT WORLD", channelId: "UC7fWeaHhqgM4Ry-RMpM2YYw", region: "global", lang: "en", color: "#E30613" },
  { id: "wion", label: "WION", channelId: "UC_gUM8rL-Lrg6O3adPW9K1g", region: "asia", lang: "en", color: "#FF6B00" },
  { id: "cna", label: "CNA", channelId: "UC83jt4dlz1Gjl58fzQrrKZg", region: "asia", lang: "en", color: "#E50000" },
  { id: "abcaus", label: "ABC AU", channelId: "UCVgO39Bk5sMo66-6o6Spn6Q", region: "global", lang: "en", color: "#00843D" },
  { id: "nhkworld", label: "NHK WORLD", channelId: "UCSPEjw8F2nQDtmUKPFNF7_A", region: "asia", lang: "en", color: "#E60012" },
  { id: "arirang", label: "ARIRANG", channelId: "UC-PHIZjV-oX8H7zD1cCN2NQ", region: "asia", lang: "en", color: "#0033A0" },
  { id: "cgtn-en", label: "CGTN", channelId: "UCgrNz-aDmcr2uuto8_DL2jg", region: "asia", lang: "en", color: "#D71920" },
  { id: "ndtv", label: "NDTV", channelId: "UCfR7gLhMBoeYDGEaXsYb3Kw", region: "asia", lang: "en", color: "#FF4500" },

  // ═══════════════════════════════════════
  // TURKISH (TR)
  // ═══════════════════════════════════════
  { id: "trthaber", label: "TRT HABER", channelId: "UCBgTP2LOFVPmq15W-RH-WXA", region: "tr", lang: "tr", color: "#E30613" },
  { id: "cnnturk", label: "CNN TÜRK", channelId: "UCV6zcRug6Hqp1UX_FdyUeBg", region: "tr", lang: "tr", color: "#CC0000" },
  { id: "ntv", label: "NTV", channelId: "UCfR7gLhMBoeYDGEaXsYb3Kw", region: "tr", lang: "tr", color: "#003DA6" },
  { id: "haberglobal", label: "HABER GLOBAL", channelId: "UCtc-a9ZUIg0_5HpsPxEO7Qg", region: "tr", lang: "tr", color: "#1E90FF" },
  { id: "ahaber", label: "A HABER", channelId: "UCKQhfw-lzz0uKnE1fY1PsAA", region: "tr", lang: "tr", color: "#FF0000" },
  { id: "haberturk", label: "HABERTÜRK", channelId: "UCn6dNfiRE_Xunu7iMyvD7AA", region: "tr", lang: "tr", color: "#0055A4" },
  { id: "tgrthaber", label: "TGRT HABER", channelId: "UCLmXd2WwLBMGWelah1NjEaA", region: "tr", lang: "tr", color: "#8B0000" },

  // ═══════════════════════════════════════
  // ARABIC (AR)
  // ═══════════════════════════════════════
  { id: "aljazeera-ar", label: "الجزيرة", channelId: "UCfiwzLy-8yKzIbsmZTzxDgw", region: "mideast", lang: "ar", color: "#D4AA00" },
  { id: "alarabiya", label: "العربية", channelId: "UCWwJMD-04gJBFOxsPjRcPOg", region: "mideast", lang: "ar", color: "#B8860B" },
  { id: "skynews-ar", label: "سكاي نيوز عربية", channelId: "UC1gJ5YOHoVOkpcpszq-oTNQ", region: "mideast", lang: "ar", color: "#0072BC" },
  { id: "france24-ar", label: "فرانس 24", channelId: "UCdTyuXgmJkG_O8_75eqej-w", region: "mideast", lang: "ar", color: "#00A1E4" },
  { id: "bbc-ar", label: "BBC عربي", channelId: "UCH1oRy1dINbMVp3UFWrKP0w", region: "mideast", lang: "ar", color: "#BB1919" },
  { id: "ajmubasher", label: "الجزيرة مباشر", channelId: "UCbqf50YqCFdSBKbKSMR-l5A", region: "mideast", lang: "ar", color: "#D4AA00" },

  // ═══════════════════════════════════════
  // GERMAN (DE)
  // ═══════════════════════════════════════
  { id: "welt", label: "WELT", channelId: "UCZMsvbAhhRblVGXmEXW8TSA", region: "eu", lang: "de", color: "#003DA6" },
  { id: "ntv-de", label: "NTV", channelId: "UCSeil5V81-mEGB1-VNR7YEA", region: "eu", lang: "de", color: "#E30613" },
  { id: "dw-de", label: "DW DEUTSCH", channelId: "UCMIgOXM2JEQ2Pv2d0_PVfcg", region: "eu", lang: "de", color: "#0077B6" },
  { id: "tagesschau", label: "TAGESSCHAU", channelId: "UC5NOEUbkLheQcaaRldYW5GA", region: "eu", lang: "de", color: "#004B87" },
  { id: "euronews-de", label: "EURONEWS DE", channelId: "UCKUBipysIPNP3iWLBNPAcXA", region: "eu", lang: "de", color: "#003DA6" },

  // ═══════════════════════════════════════
  // SPANISH (ES)
  // ═══════════════════════════════════════
  { id: "france24-es", label: "FRANCE 24 ES", channelId: "UCUdOoVWuWmgo1wByzcsyKDQ", region: "latam", lang: "es", color: "#00A1E4" },
  { id: "dw-es", label: "DW ESPAÑOL", channelId: "UCT2VKl-tSXjNfSedGNfbfIA", region: "latam", lang: "es", color: "#0077B6" },
  { id: "euronews-es", label: "EURONEWS ES", channelId: "UCyoGb3SMlTlB8CLGVH4c8Rw", region: "latam", lang: "es", color: "#003DA6" },
  { id: "rtve", label: "RTVE 24H", channelId: "UCmoHk6hY1bOb25oRNFj0Ibg", region: "eu", lang: "es", color: "#E30613" },
  { id: "cnn-es", label: "CNN ESPAÑOL", channelId: "UCkhAfig2sENqfGdpAjkmrCA", region: "latam", lang: "es", color: "#CC0000" },
  { id: "telefe", label: "TELEFE", channelId: "UCWFKwAilAd18C8GCFyyCcqg", region: "latam", lang: "es", color: "#0055A4" },

  // ═══════════════════════════════════════
  // FRENCH (FR)
  // ═══════════════════════════════════════
  { id: "france24-fr", label: "FRANCE 24", channelId: "UCCCPCZNChQdGa9EkABnGJfQ", region: "eu", lang: "fr", color: "#00A1E4" },
  { id: "bfmtv", label: "BFMTV", channelId: "UC-9-kyTW8ZkZNDHQJ6FgpwQ", region: "eu", lang: "fr", color: "#FF6600" },
  { id: "lci", label: "LCI", channelId: "UCewhc0fvja891XkpIPGRMxQ", region: "eu", lang: "fr", color: "#E30613" },
  { id: "franceinfo", label: "FRANCEINFO", channelId: "UCO6K_kkdP-lnSCiO3tPx7WA", region: "eu", lang: "fr", color: "#003DA6" },
  { id: "euronews-fr", label: "EURONEWS FR", channelId: "UCSrZ3UV4jOidv8ppoVuvW9Q", region: "eu", lang: "fr", color: "#003DA6" },
  { id: "tv5monde", label: "TV5MONDE", channelId: "UC9p3RsSH-BfFNyi7EYQ4DWA", region: "global", lang: "fr", color: "#8B0000" },

  // ═══════════════════════════════════════
  // JAPANESE (JA)
  // ═══════════════════════════════════════
  { id: "tbs-ja", label: "TBS NEWS", channelId: "UC6AG81pAkf6Lbi_1VC5NmPA", region: "asia", lang: "ja", color: "#0033A0" },
  { id: "ann-ja", label: "ANN NEWS", channelId: "UCGCZAYq5Xxojl_tSXcVJhiQ", region: "asia", lang: "ja", color: "#E60012" },
  { id: "fnn-ja", label: "FNN PRIME", channelId: "UCtM1M9KDH0YHfT2BCeGSKIA", region: "asia", lang: "ja", color: "#FF6B00" },
  { id: "ntv-ja", label: "日テレNEWS", channelId: "UCuTAXTexrhetbOe3DdtjdAA", region: "asia", lang: "ja", color: "#003DA6" },
  { id: "nhk-ja", label: "NHK", channelId: "UCSPEjw8F2nQDtmUKPFNF7_A", region: "asia", lang: "ja", color: "#E60012" },

  // ═══════════════════════════════════════
  // KOREAN (KO)
  // ═══════════════════════════════════════
  { id: "ytn", label: "YTN", channelId: "UChlgI3UHCOnwUGzWzbJ3H5w", region: "asia", lang: "ko", color: "#003DA6" },
  { id: "kbs-ko", label: "KBS NEWS", channelId: "UCcQTRi69dsVYHN3exePtZ1A", region: "asia", lang: "ko", color: "#0033A0" },
  { id: "mbc-ko", label: "MBC NEWS", channelId: "UCF4Wxdo3inmxP-Y59wXDsFw", region: "asia", lang: "ko", color: "#003DA6" },
  { id: "jtbc-ko", label: "JTBC NEWS", channelId: "UCsU-I-vHLiaMfV_ceaYz5rQ", region: "asia", lang: "ko", color: "#E30613" },
  { id: "sbs-ko", label: "SBS NEWS", channelId: "UCkinYTS9IHqOEwR1Sze2JTw", region: "asia", lang: "ko", color: "#0055A4" },

  // ═══════════════════════════════════════
  // RUSSIAN (RU)
  // ═══════════════════════════════════════
  { id: "euronews-ru", label: "EURONEWS RU", channelId: "UCnfpMGQ9Bkl3JB1tH5FFlnA", region: "eu", lang: "ru", color: "#003DA6" },
  { id: "currenttime", label: "НАСТОЯЩЕЕ ВРЕМЯ", channelId: "UCdubelOloxR3wzMOG_bMJ4w", region: "eu", lang: "ru", color: "#1E90FF" },

  // ═══════════════════════════════════════
  // CHINESE (ZH)
  // ═══════════════════════════════════════
  { id: "cgtn-zh", label: "CGTN 中文", channelId: "UCmv5DBKnHNQMBb5vK1FU_tQ", region: "asia", lang: "zh", color: "#D71920" },
  { id: "ntdtv", label: "NTDTV 新唐人", channelId: "UCtovJRlqAU9gk7xQGCZy2jA", region: "asia", lang: "zh", color: "#003DA6" },
  { id: "dw-zh", label: "DW 中文", channelId: "UCv-FYOGxkh1QyCu7TXxSVEg", region: "asia", lang: "zh", color: "#0077B6" },
  { id: "phoenix-zh", label: "凤凰卫视", channelId: "UCDtlBYhbSCMgorN2xoC3eBw", region: "asia", lang: "zh", color: "#FFD700" },
];

/**
 * Get channels filtered by locale.
 * Returns: all international (en) + channels matching user's language.
 */
export function getChannelsByLocale(locale: string): LiveChannel[] {
  const intl = LIVE_CHANNELS.filter((ch) => ch.lang === "en");
  if (locale === "en") return intl;

  const localized = LIVE_CHANNELS.filter((ch) => ch.lang === locale);
  // Put localized channels first, then international
  return [...localized, ...intl];
}

/**
 * Live webcam feeds from key global cities.
 * YouTube-based webcams with stable stream IDs.
 */
export interface LiveWebcam {
  id: string;
  city: string;
  country: string;
  videoId: string;
  region: "mideast" | "europe" | "americas" | "asia" | "space";
  color: string;
}

export const LIVE_WEBCAMS: LiveWebcam[] = [
  // ── Middle East ──
  { id: "jerusalem", city: "Jerusalem", country: "IL", videoId: "jJbKaOFjqiI", region: "mideast", color: "#ff4757" },
  { id: "mecca", city: "Mecca", country: "SA", videoId: "gRbiBkFbh0E", region: "mideast", color: "#ffd000" },
  { id: "dubai", city: "Dubai", country: "AE", videoId: "GfB5dbkh1QU", region: "mideast", color: "#00e5ff" },
  // ── Europe ──
  { id: "london", city: "London", country: "GB", videoId: "54m573U9dz0", region: "europe", color: "#00e5ff" },
  { id: "paris", city: "Paris", country: "FR", videoId: "26PFj9-3Cqg", region: "europe", color: "#8a5cf6" },
  { id: "rome", city: "Rome", country: "IT", videoId: "A8r44Bz5XEY", region: "europe", color: "#00ff88" },
  // ── Americas ──
  { id: "nyc", city: "New York", country: "US", videoId: "1-iS7LArMPA", region: "americas", color: "#ffd000" },
  { id: "miami", city: "Miami", country: "US", videoId: "FhLCABMlo1c", region: "americas", color: "#00ff88" },
  // ── Asia ──
  { id: "tokyo", city: "Tokyo", country: "JP", videoId: "DjYZk8nrXVY", region: "asia", color: "#ff4757" },
  { id: "seoul", city: "Seoul", country: "KR", videoId: "8Jqfl3GM3GU", region: "asia", color: "#00e5ff" },
  // ── Space ──
  { id: "iss", city: "ISS", country: "SPACE", videoId: "P9C25Un7xaM", region: "space", color: "#8a5cf6" },
];

export const WEBCAM_REGIONS = [
  { id: "all", label: "ALL" },
  { id: "mideast", label: "MIDDLE EAST" },
  { id: "europe", label: "EUROPE" },
  { id: "americas", label: "AMERICAS" },
  { id: "asia", label: "ASIA" },
  { id: "space", label: "SPACE" },
] as const;
