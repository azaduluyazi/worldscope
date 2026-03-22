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
  category?: "news" | "business" | "documentary";
}

export const LIVE_CHANNELS: LiveChannel[] = [
  // ═══════════════════════════════════════
  // INTERNATIONAL (English)
  // ═══════════════════════════════════════
  { id: "aljazeera-en", label: "AL JAZEERA", channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg", videoId: "gCNeDWCI0vo", type: "youtube", region: "global", lang: "en", color: "#D4AA00" },
  { id: "france24-en", label: "FRANCE 24", channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg", videoId: "h3MuIUNCCzI", type: "youtube", region: "eu", lang: "en", color: "#00A1E4" },
  { id: "dw-en", label: "DW NEWS", channelId: "UCknLrEdhRCp1aegoMqRaCZg", videoId: "GE_SfNbYa-s", type: "youtube", region: "eu", lang: "en", color: "#0077B6" },
  { id: "skynews", label: "SKY NEWS", channelId: "UCoMdktPbSTixAyNGwb-UYkQ", videoId: "9Auq9mYxFEE", type: "youtube", region: "global", lang: "en", color: "#C41230" },
  { id: "euronews-en", label: "EURONEWS", channelId: "UCW2QcKZiU8aUGg4yxCIditg", videoId: "pykpO5kQJ98", type: "youtube", region: "eu", lang: "en", color: "#003DA6" },
  { id: "cnbc", label: "CNBC", channelId: "UCvJJ_dzjViJCoLf5uKUTwoA", videoId: "9NyxcX3rhQs", type: "youtube", region: "us", lang: "en", color: "#005594" },
  { id: "bloomberg", label: "BLOOMBERG", channelId: "UCIALMKvObZNtJ68-rmLjXoA", videoId: "oPmFnOCSLyA", type: "youtube", region: "us", lang: "en", color: "#2800D7" },
  { id: "trtworld", label: "TRT WORLD", channelId: "UC7fWeaHhqgM4Ry-RMpM2YYw", type: "youtube", region: "global", lang: "en", color: "#E30613" },
  { id: "wion", label: "WION", channelId: "UC_gUM8rL-Lrg6O3adPW9K1g", type: "youtube", region: "asia", lang: "en", color: "#FF6B00" },
  { id: "cna", label: "CNA", channelId: "UC83jt4dlz1Gjl58fzQrrKZg", type: "youtube", region: "asia", lang: "en", color: "#E50000" },
  { id: "abcaus", label: "ABC AU", channelId: "UCVgO39Bk5sMo66-6o6Spn6Q", type: "youtube", region: "global", lang: "en", color: "#00843D" },
  { id: "nhkworld", label: "NHK WORLD", channelId: "UCSPEjw8F2nQDtmUKPFNF7_A", type: "youtube", region: "asia", lang: "en", color: "#E60012" },
  { id: "arirang", label: "ARIRANG", channelId: "UC-PHIZjV-oX8H7zD1cCN2NQ", type: "youtube", region: "asia", lang: "en", color: "#0033A0" },
  { id: "cgtn-en", label: "CGTN", channelId: "UCgrNz-aDmcr2uuto8_DL2jg", type: "youtube", region: "asia", lang: "en", color: "#D71920" },
  { id: "ndtv", label: "NDTV", channelId: "UCfR7gLhMBoeYDGEaXsYb3Kw", type: "youtube", region: "asia", lang: "en", color: "#FF4500" },

  // ═══════════════════════════════════════
  // TURKISH (TR)
  // ═══════════════════════════════════════
  { id: "trthaber", label: "TRT HABER", channelId: "UCBgTP2LOFVPmq15W-RH-WXA", type: "youtube", region: "tr", lang: "tr", color: "#E30613" },
  { id: "cnnturk", label: "CNN TÜRK", channelId: "UCV6zcRug6Hqp1UX_FdyUeBg", type: "youtube", region: "tr", lang: "tr", color: "#CC0000" },
  { id: "ntv", label: "NTV", channelId: "UCfR7gLhMBoeYDGEaXsYb3Kw", type: "youtube", region: "tr", lang: "tr", color: "#003DA6" },
  { id: "haberglobal", label: "HABER GLOBAL", channelId: "UCtc-a9ZUIg0_5HpsPxEO7Qg", type: "youtube", region: "tr", lang: "tr", color: "#1E90FF" },
  { id: "ahaber", label: "A HABER", channelId: "UCKQhfw-lzz0uKnE1fY1PsAA", type: "youtube", region: "tr", lang: "tr", color: "#FF0000" },
  { id: "haberturk", label: "HABERTÜRK", channelId: "UCn6dNfiRE_Xunu7iMyvD7AA", type: "youtube", region: "tr", lang: "tr", color: "#0055A4" },
  { id: "tgrthaber", label: "TGRT HABER", channelId: "UCLmXd2WwLBMGWelah1NjEaA", type: "youtube", region: "tr", lang: "tr", color: "#8B0000" },

  // ═══════════════════════════════════════
  // ARABIC (AR)
  // ═══════════════════════════════════════
  { id: "aljazeera-ar", label: "الجزيرة", channelId: "UCfiwzLy-8yKzIbsmZTzxDgw", type: "youtube", region: "mideast", lang: "ar", color: "#D4AA00" },
  { id: "alarabiya", label: "العربية", channelId: "UCWwJMD-04gJBFOxsPjRcPOg", type: "youtube", region: "mideast", lang: "ar", color: "#B8860B" },
  { id: "skynews-ar", label: "سكاي نيوز عربية", channelId: "UC1gJ5YOHoVOkpcpszq-oTNQ", type: "youtube", region: "mideast", lang: "ar", color: "#0072BC" },
  { id: "france24-ar", label: "فرانس 24", channelId: "UCdTyuXgmJkG_O8_75eqej-w", type: "youtube", region: "mideast", lang: "ar", color: "#00A1E4" },
  { id: "bbc-ar", label: "BBC عربي", channelId: "UCH1oRy1dINbMVp3UFWrKP0w", type: "youtube", region: "mideast", lang: "ar", color: "#BB1919" },
  { id: "ajmubasher", label: "الجزيرة مباشر", channelId: "UCbqf50YqCFdSBKbKSMR-l5A", type: "youtube", region: "mideast", lang: "ar", color: "#D4AA00" },

  // ═══════════════════════════════════════
  // GERMAN (DE)
  // ═══════════════════════════════════════
  { id: "welt", label: "WELT", channelId: "UCZMsvbAhhRblVGXmEXW8TSA", type: "youtube", region: "eu", lang: "de", color: "#003DA6" },
  { id: "ntv-de", label: "NTV", channelId: "UCSeil5V81-mEGB1-VNR7YEA", type: "youtube", region: "eu", lang: "de", color: "#E30613" },
  { id: "dw-de", label: "DW DEUTSCH", channelId: "UCMIgOXM2JEQ2Pv2d0_PVfcg", type: "youtube", region: "eu", lang: "de", color: "#0077B6" },
  { id: "tagesschau", label: "TAGESSCHAU", channelId: "UC5NOEUbkLheQcaaRldYW5GA", type: "youtube", region: "eu", lang: "de", color: "#004B87" },
  { id: "euronews-de", label: "EURONEWS DE", channelId: "UCKUBipysIPNP3iWLBNPAcXA", type: "youtube", region: "eu", lang: "de", color: "#003DA6" },

  // ═══════════════════════════════════════
  // SPANISH (ES)
  // ═══════════════════════════════════════
  { id: "france24-es", label: "FRANCE 24 ES", channelId: "UCUdOoVWuWmgo1wByzcsyKDQ", type: "youtube", region: "latam", lang: "es", color: "#00A1E4" },
  { id: "dw-es", label: "DW ESPAÑOL", channelId: "UCT2VKl-tSXjNfSedGNfbfIA", type: "youtube", region: "latam", lang: "es", color: "#0077B6" },
  { id: "euronews-es", label: "EURONEWS ES", channelId: "UCyoGb3SMlTlB8CLGVH4c8Rw", type: "youtube", region: "latam", lang: "es", color: "#003DA6" },
  { id: "rtve", label: "RTVE 24H", channelId: "UCmoHk6hY1bOb25oRNFj0Ibg", type: "youtube", region: "eu", lang: "es", color: "#E30613" },
  { id: "cnn-es", label: "CNN ESPAÑOL", channelId: "UCkhAfig2sENqfGdpAjkmrCA", type: "youtube", region: "latam", lang: "es", color: "#CC0000" },
  { id: "telefe", label: "TELEFE", channelId: "UCWFKwAilAd18C8GCFyyCcqg", type: "youtube", region: "latam", lang: "es", color: "#0055A4" },

  // ═══════════════════════════════════════
  // FRENCH (FR)
  // ═══════════════════════════════════════
  { id: "france24-fr", label: "FRANCE 24", channelId: "UCCCPCZNChQdGa9EkABnGJfQ", type: "youtube", region: "eu", lang: "fr", color: "#00A1E4" },
  { id: "bfmtv", label: "BFMTV", channelId: "UC-9-kyTW8ZkZNDHQJ6FgpwQ", type: "youtube", region: "eu", lang: "fr", color: "#FF6600" },
  { id: "lci", label: "LCI", channelId: "UCewhc0fvja891XkpIPGRMxQ", type: "youtube", region: "eu", lang: "fr", color: "#E30613" },
  { id: "franceinfo", label: "FRANCEINFO", channelId: "UCO6K_kkdP-lnSCiO3tPx7WA", type: "youtube", region: "eu", lang: "fr", color: "#003DA6" },
  { id: "euronews-fr", label: "EURONEWS FR", channelId: "UCSrZ3UV4jOidv8ppoVuvW9Q", type: "youtube", region: "eu", lang: "fr", color: "#003DA6" },
  { id: "tv5monde", label: "TV5MONDE", channelId: "UC9p3RsSH-BfFNyi7EYQ4DWA", type: "youtube", region: "global", lang: "fr", color: "#8B0000" },

  // ═══════════════════════════════════════
  // JAPANESE (JA)
  // ═══════════════════════════════════════
  { id: "tbs-ja", label: "TBS NEWS", channelId: "UC6AG81pAkf6Lbi_1VC5NmPA", type: "youtube", region: "asia", lang: "ja", color: "#0033A0" },
  { id: "ann-ja", label: "ANN NEWS", channelId: "UCGCZAYq5Xxojl_tSXcVJhiQ", type: "youtube", region: "asia", lang: "ja", color: "#E60012" },
  { id: "fnn-ja", label: "FNN PRIME", channelId: "UCtM1M9KDH0YHfT2BCeGSKIA", type: "youtube", region: "asia", lang: "ja", color: "#FF6B00" },
  { id: "ntv-ja", label: "日テレNEWS", channelId: "UCuTAXTexrhetbOe3DdtjdAA", type: "youtube", region: "asia", lang: "ja", color: "#003DA6" },
  { id: "nhk-ja", label: "NHK", channelId: "UCSPEjw8F2nQDtmUKPFNF7_A", type: "youtube", region: "asia", lang: "ja", color: "#E60012" },

  // ═══════════════════════════════════════
  // KOREAN (KO)
  // ═══════════════════════════════════════
  { id: "ytn", label: "YTN", channelId: "UChlgI3UHCOnwUGzWzbJ3H5w", type: "youtube", region: "asia", lang: "ko", color: "#003DA6" },
  { id: "kbs-ko", label: "KBS NEWS", channelId: "UCcQTRi69dsVYHN3exePtZ1A", type: "youtube", region: "asia", lang: "ko", color: "#0033A0" },
  { id: "mbc-ko", label: "MBC NEWS", channelId: "UCF4Wxdo3inmxP-Y59wXDsFw", type: "youtube", region: "asia", lang: "ko", color: "#003DA6" },
  { id: "jtbc-ko", label: "JTBC NEWS", channelId: "UCsU-I-vHLiaMfV_ceaYz5rQ", type: "youtube", region: "asia", lang: "ko", color: "#E30613" },
  { id: "sbs-ko", label: "SBS NEWS", channelId: "UCkinYTS9IHqOEwR1Sze2JTw", type: "youtube", region: "asia", lang: "ko", color: "#0055A4" },

  // ═══════════════════════════════════════
  // RUSSIAN (RU)
  // ═══════════════════════════════════════
  { id: "euronews-ru", label: "EURONEWS RU", channelId: "UCnfpMGQ9Bkl3JB1tH5FFlnA", type: "youtube", region: "eu", lang: "ru", color: "#003DA6" },
  { id: "currenttime", label: "НАСТОЯЩЕЕ ВРЕМЯ", channelId: "UCdubelOloxR3wzMOG_bMJ4w", type: "youtube", region: "eu", lang: "ru", color: "#1E90FF" },

  // ═══════════════════════════════════════
  // CHINESE (ZH)
  // ═══════════════════════════════════════
  { id: "cgtn-zh", label: "CGTN 中文", channelId: "UCmv5DBKnHNQMBb5vK1FU_tQ", type: "youtube", region: "asia", lang: "zh", color: "#D71920" },
  { id: "ntdtv", label: "NTDTV 新唐人", channelId: "UCtovJRlqAU9gk7xQGCZy2jA", type: "youtube", region: "asia", lang: "zh", color: "#003DA6" },
  { id: "dw-zh", label: "DW 中文", channelId: "UCv-FYOGxkh1QyCu7TXxSVEg", type: "youtube", region: "asia", lang: "zh", color: "#0077B6" },
  { id: "phoenix-zh", label: "凤凰卫视", channelId: "UCDtlBYhbSCMgorN2xoC3eBw", type: "youtube", region: "asia", lang: "zh", color: "#FFD700" },

  // ═══════════════════════════════════════
  // HLS DIRECT STREAMS (iptv-org sourced)
  // ═══════════════════════════════════════

  // English HLS
  { id: "hls-nbcnews", label: "NBC NEWS NOW", hlsUrl: "https://d1bl6tskrpq9ze.cloudfront.net/hls/master.m3u8", type: "hls", region: "us", lang: "en", country: "US", color: "#E51837", category: "news" },
  { id: "hls-bloomberg-us", label: "BLOOMBERG US", hlsUrl: "https://bloomberg.com/media-manifest/streams/us.m3u8", type: "hls", region: "us", lang: "en", country: "US", color: "#2800D7", category: "business" },
  { id: "hls-newsmax", label: "NEWSMAX", hlsUrl: "https://nmx1ota.akamaized.net/hls/live/2107010/Live_1/index.m3u8", type: "hls", region: "us", lang: "en", country: "US", color: "#003DA6", category: "news" },
  { id: "hls-reuters", label: "REUTERS TV", hlsUrl: "https://d5bxknkoxytmb.cloudfront.net/playlist/amg00453-reuters-reuters-samsunggb/playlist.m3u8", type: "hls", region: "global", lang: "en", country: "US", color: "#FF6600", category: "news" },
  { id: "hls-yahoo-finance", label: "YAHOO FINANCE", hlsUrl: "https://d1ewctnvcwvvvu.cloudfront.net/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", color: "#6001D2", category: "business" },
  { id: "hls-gbnews", label: "GB NEWS", hlsUrl: "https://live-gbnews.simplestreamcdn.com/s3/gbnews/index.m3u8", type: "hls", region: "eu", lang: "en", country: "GB", color: "#003DA6", category: "news" },
  { id: "hls-ndtv", label: "NDTV 24x7", hlsUrl: "https://ndtv24x7elemarchana.akamaized.net/hls/live/2003678/ndtv24x7/master.m3u8", type: "hls", region: "asia", lang: "en", country: "IN", color: "#E30613", category: "news" },
  { id: "hls-wion", label: "WION HLS", hlsUrl: "https://d7x8z4yuq42qn.cloudfront.net/index_7.m3u8", type: "hls", region: "asia", lang: "en", country: "IN", color: "#FF6B00", category: "news" },
  { id: "hls-aje", label: "AL JAZEERA EN", hlsUrl: "https://live-hls-web-aje-fa.thehlive.com/AJE/index.m3u8", type: "hls", region: "global", lang: "en", country: "QA", color: "#D4AA00", category: "news" },

  // Turkish HLS
  { id: "hls-trthaber", label: "TRT HABER", hlsUrl: "https://tv-trthaber.medya.trt.com.tr/master.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#E30613", category: "news" },
  { id: "hls-ntv", label: "NTV", hlsUrl: "https://dogus-live.daioncdn.net/ntv/ntv.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#003DA6", category: "news" },
  { id: "hls-haberturk", label: "HABERTÜRK", hlsUrl: "https://ciner-live.daioncdn.net/haberturktv/haberturktv.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#0055A4", category: "news" },
  { id: "hls-bloomberght", label: "BLOOMBERG HT", hlsUrl: "https://ciner-live.daioncdn.net/bloomberght/bloomberght.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#2800D7", category: "business" },
  { id: "hls-haberglobal", label: "HABER GLOBAL", hlsUrl: "https://tv.ensonhaber.com/haberglobal/haberglobal.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#1E90FF", category: "news" },
  { id: "hls-tv100", label: "TV100", hlsUrl: "https://tv100-live.daioncdn.net/tv100/tv100.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#E30613", category: "news" },
  { id: "hls-tgrt", label: "TGRT HABER", hlsUrl: "https://canli.tgrthaber.com/tgrt.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#8B0000", category: "news" },
  { id: "hls-trtbelgesel", label: "TRT BELGESEL", hlsUrl: "https://tv-trtbelgesel.medya.trt.com.tr/master.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#004B87", category: "documentary" },

  // Arabic HLS
  { id: "hls-aja", label: "الجزيرة", hlsUrl: "https://live-hls-web-aja.getaj.net/AJA/index.m3u8", type: "hls", region: "mideast", lang: "ar", country: "QA", color: "#D4AA00", category: "news" },
  { id: "hls-alarabiya", label: "العربية", hlsUrl: "https://live.alarabiya.net/alarabiapublish/alarabiya.smil/playlist.m3u8", type: "hls", region: "mideast", lang: "ar", country: "AE", color: "#B8860B", category: "news" },
  { id: "hls-skynews-ar", label: "سكاي نيوز عربية", hlsUrl: "https://live-stream.skynewsarabia.com/c-horizontal-channel/horizontal-stream/index.m3u8", type: "hls", region: "mideast", lang: "ar", country: "AE", color: "#0072BC", category: "news" },
  { id: "hls-asharq", label: "الشرق", hlsUrl: "https://live-news.asharq.com/asharq.m3u8", type: "hls", region: "mideast", lang: "ar", country: "SA", color: "#003DA6", category: "news" },
  { id: "hls-ekhbariya", label: "الإخبارية", hlsUrl: "https://shd-gcp-live.edgenextcdn.net/live/bitmovin-al-ekhbaria/297b3ef1cd0633ad9cfba7473a686a06/index.m3u8", type: "hls", region: "mideast", lang: "ar", country: "SA", color: "#00843D", category: "news" },

  // German HLS
  { id: "hls-tagesschau24", label: "TAGESSCHAU 24", hlsUrl: "https://tagesschau.akamaized.net/hls/live/2020115/tagesschau/tagesschau_1/master.m3u8", type: "hls", region: "eu", lang: "de", country: "DE", color: "#004B87", category: "news" },
  { id: "hls-daserste", label: "DAS ERSTE", hlsUrl: "https://daserste-live.ard-mcdn.de/daserste/live/hls/int/master.m3u8", type: "hls", region: "eu", lang: "de", country: "DE", color: "#003DA6", category: "news" },

  // French HLS
  { id: "hls-bfmtv", label: "BFM TV", hlsUrl: "https://live-cdn-stream-euw1.bfmtv.bct.nextradiotv.com/master.m3u8", type: "hls", region: "eu", lang: "fr", country: "FR", color: "#FF6600", category: "news" },
  { id: "hls-bfmbiz", label: "BFM BUSINESS", hlsUrl: "https://live-cdn-stream-euw1.bfmb.bct.nextradiotv.com/master.m3u8", type: "hls", region: "eu", lang: "fr", country: "FR", color: "#003DA6", category: "business" },
  { id: "hls-france24fr", label: "FRANCE 24 FR", hlsUrl: "https://live.france24.com/hls/live/2037179/F24_FR_HI_HLS/master_5000.m3u8", type: "hls", region: "eu", lang: "fr", country: "FR", color: "#00A1E4", category: "news" },
  { id: "hls-africa24", label: "AFRICA 24", hlsUrl: "https://africa24.vedge.infomaniak.com/livecast/ik:africa24/manifest.m3u8", type: "hls", region: "africa", lang: "fr", country: "FR", color: "#FFD700", category: "news" },

  // Spanish HLS
  { id: "hls-canal24h", label: "CANAL 24H", hlsUrl: "https://ztnr.rtve.es/ztnr/1694255.m3u8", type: "hls", region: "eu", lang: "es", country: "ES", color: "#E30613", category: "news" },
  { id: "hls-24hchile", label: "24 HORAS CHILE", hlsUrl: "https://d32rw80ytx9uxs.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-vlldndmow4yre/24HES.m3u8", type: "hls", region: "latam", lang: "es", country: "CL", color: "#003DA6", category: "news" },

  // Japanese HLS
  { id: "hls-nhkworld", label: "NHK WORLD", hlsUrl: "https://masterpl.hls.nhkworld.jp/hls/w/live/smarttv.m3u8", type: "hls", region: "asia", lang: "ja", country: "JP", color: "#E60012", category: "news" },

  // Korean HLS
  { id: "hls-arirang", label: "ARIRANG TV", hlsUrl: "http://amdlive-ch01.ctnd.com.edgesuite.net/arirang_1ch/smil:arirang_1ch.smil/playlist.m3u8", type: "hls", region: "asia", lang: "ko", country: "KR", color: "#0033A0", category: "news" },
  { id: "hls-ktv", label: "KOREA TV", hlsUrl: "https://hlive.ktv.go.kr/live/klive_h.stream/playlist.m3u8", type: "hls", region: "asia", lang: "ko", country: "KR", color: "#003DA6", category: "news" },

  // Russian HLS
  { id: "hls-rbktv", label: "РБК-ТВ", hlsUrl: "http://online-video.rbc.ru/online2/rbctv.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", color: "#E30613", category: "business" },
  { id: "hls-mir24", label: "МИР 24", hlsUrl: "http://hls.mirtv.cdnvideo.ru/mirtv-parampublish/mir24_2500/playlist.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", color: "#003DA6", category: "news" },

  // Chinese HLS
  { id: "hls-cgtn-en", label: "CGTN EN", hlsUrl: "https://english-livebkali.cgtn.com/live/encgtn.m3u8", type: "hls", region: "asia", lang: "zh", country: "CN", color: "#D71920", category: "news" },
  { id: "hls-cgtn-doc", label: "CGTN DOC", hlsUrl: "https://amg00405-rakutentv-cgtndocumentary-rakuten-0ql8j.amagi.tv/master.m3u8", type: "hls", region: "asia", lang: "zh", country: "CN", color: "#D71920", category: "documentary" },

  // ═══════════════════════════════════════
  // ITALY (IT) — HLS
  // ═══════════════════════════════════════
  { id: "hls-rainews24", label: "RAI NEWS 24", hlsUrl: "https://rainews1-live.akamaized.net/hls/live/598326/rainews1/rainews1/playlist.m3u8", type: "hls", region: "eu", lang: "it", country: "IT", color: "#003DA6", category: "news" },
  { id: "hls-tgcom24", label: "TGCOM 24", hlsUrl: "https://live2-mediaset-it.akamaized.net/Content/hls_h0_clr_vos/live/channel(kf)/index.m3u8", type: "hls", region: "eu", lang: "it", country: "IT", color: "#E30613", category: "news" },
  { id: "hls-lacnews24", label: "LAC NEWS 24", hlsUrl: "https://f5842579ff984c1c98d63b8d789673eb.msvdn.net/live/S27391994/HVvPMzy/playlist.m3u8", type: "hls", region: "eu", lang: "it", country: "IT", color: "#FF6600", category: "news" },

  // ═══════════════════════════════════════
  // BRAZIL (BR) — HLS
  // ═══════════════════════════════════════
  { id: "hls-recordnews", label: "RECORD NEWS", hlsUrl: "https://rnw-rn.otteravision.com/rnw/rn/rnw_rn.m3u8", type: "hls", region: "latam", lang: "pt", country: "BR", color: "#00843D", category: "news" },
  { id: "hls-canalgov", label: "CANAL GOV", hlsUrl: "https://canalgov-stream.ebc.com.br/index.m3u8", type: "hls", region: "latam", lang: "pt", country: "BR", color: "#003DA6", category: "news" },
  { id: "hls-tvcamara", label: "TV CÂMARA", hlsUrl: "https://stream3.camara.gov.br/tv1/manifest.m3u8", type: "hls", region: "latam", lang: "pt", country: "BR", color: "#0055A4", category: "news" },
  { id: "hls-tvbrasil", label: "TV BRASIL", hlsUrl: "https://tvbrasil-stream.ebc.com.br/index.m3u8", type: "hls", region: "latam", lang: "pt", country: "BR", color: "#FFD700", category: "news" },
  { id: "hls-jpnews", label: "JOVEM PAN NEWS", hlsUrl: "https://d6yfbj4xxtrod.cloudfront.net/out/v1/7836eb391ec24452b149f3dc6df15bbd/index.m3u8", type: "hls", region: "latam", lang: "pt", country: "BR", color: "#FF4500", category: "news" },

  // ═══════════════════════════════════════
  // MEXICO (MX) — HLS
  // ═══════════════════════════════════════
  { id: "hls-adn40", label: "ADN 40", hlsUrl: "https://mdstrm.com/live-stream-playlist/60b578b060947317de7b57ac.m3u8", type: "hls", region: "latam", lang: "es", country: "MX", color: "#FF6B00", category: "news" },
  { id: "hls-forotv", label: "FORO TV", hlsUrl: "https://channel02-notusa.akamaized.net/hls/live/2023914/event01/index.m3u8", type: "hls", region: "latam", lang: "es", country: "MX", color: "#003DA6", category: "news" },
  { id: "hls-teleformula", label: "TELEFÓRMULA", hlsUrl: "https://mdstrm.com/live-stream-playlist/62f2c855f7981b5a5a2d8763.m3u8", type: "hls", region: "latam", lang: "es", country: "MX", color: "#E30613", category: "news" },
  { id: "hls-capital21", label: "CAPITAL 21", hlsUrl: "https://video.cdmx.gob.mx/redes/stream.m3u8", type: "hls", region: "latam", lang: "es", country: "MX", color: "#0055A4", category: "news" },

  // ═══════════════════════════════════════
  // ARGENTINA (AR) — HLS
  // ═══════════════════════════════════════
  { id: "hls-a24", label: "A24", hlsUrl: "https://g5.vxral-slo.transport.edge-access.net/a12/ngrp:a24-100056_all/playlist.m3u8?sense=true", type: "hls", region: "latam", lang: "es", country: "AR", color: "#FF6600", category: "news" },
  { id: "hls-tvpublica", label: "TV PUBLICA", hlsUrl: "https://ola1.com.ar/tvp/index.m3u8", type: "hls", region: "latam", lang: "es", country: "AR", color: "#003DA6", category: "news" },

  // ═══════════════════════════════════════
  // ISRAEL (IL) — HLS
  // ═══════════════════════════════════════
  { id: "hls-i24news-en", label: "I24 NEWS EN", hlsUrl: "https://bcovlive-a.akamaihd.net/ecf224f43f3b43e69471a7b626481af0/eu-central-1/5377161796001/playlist.m3u8", type: "hls", region: "mideast", lang: "en", country: "IL", color: "#0055A4", category: "news" },
  { id: "hls-i24news-he", label: "I24 NEWS HE", hlsUrl: "https://bcovlive-a.akamaihd.net/d89ede8094c741b7924120b27764153c/eu-central-1/5377161796001/playlist.m3u8", type: "hls", region: "mideast", lang: "he", country: "IL", color: "#003DA6", category: "news" },
  { id: "hls-i24news-ar", label: "I24 NEWS AR", hlsUrl: "https://bcovlive-a.akamaihd.net/95116e8d79524d87bf3ac20ba04241e3/eu-central-1/5377161796001/playlist.m3u8", type: "hls", region: "mideast", lang: "ar", country: "IL", color: "#D4AA00", category: "news" },
  { id: "hls-i24news-fr", label: "I24 NEWS FR", hlsUrl: "https://bcovlive-a.akamaihd.net/41814196d97e433fb401c5e632d985e9/eu-central-1/5377161796001/playlist.m3u8", type: "hls", region: "mideast", lang: "fr", country: "IL", color: "#00A1E4", category: "news" },
  { id: "hls-knesset", label: "KNESSET TV", hlsUrl: "https://contact.gostreaming.tv/Knesset/myStream/playlist.m3u8", type: "hls", region: "mideast", lang: "he", country: "IL", color: "#004B87", category: "news" },

  // ═══════════════════════════════════════
  // EGYPT (EG) — HLS
  // ═══════════════════════════════════════
  { id: "hls-alghadtv", label: "AL GHAD TV", hlsUrl: "https://eazyvwqssi.erbvr.com/alghadtv/alghadtv.m3u8", type: "hls", region: "mideast", lang: "ar", country: "EG", color: "#E30613", category: "news" },

  // ═══════════════════════════════════════
  // PAKISTAN (PK) — HLS
  // ═══════════════════════════════════════
  { id: "hls-dunyanews", label: "DUNYA NEWS", hlsUrl: "https://imob.dunyanews.tv/livehd/ngrp:dunyalivehd_2_all/playlist.m3u8", type: "hls", region: "asia", lang: "ur", country: "PK", color: "#00843D", category: "news" },
  { id: "hls-neonews", label: "NEO NEWS", hlsUrl: "https://vodzong.mjunoon.tv:8087/streamtest/Neo-110/playlist.m3u8", type: "hls", region: "asia", lang: "ur", country: "PK", color: "#003DA6", category: "news" },
  { id: "hls-newsone-pk", label: "NEWS ONE", hlsUrl: "https://vodzong.mjunoon.tv:8087/streamtest/NEWS1-128/playlist.m3u8", type: "hls", region: "asia", lang: "ur", country: "PK", color: "#E30613", category: "news" },
  { id: "hls-samaa", label: "SAMAA TV", hlsUrl: "https://vodzong.mjunoon.tv:8087/streamtest/SAMAA-173/playlist.m3u8", type: "hls", region: "asia", lang: "ur", country: "PK", color: "#FF6600", category: "news" },

  // ═══════════════════════════════════════
  // NIGERIA (NG) — HLS
  // ═══════════════════════════════════════
  { id: "hls-channelstv", label: "CHANNELS TV", hlsUrl: "https://cs2.push2stream.com/CHANNELSTV-DVR/playlist.m3u8", type: "hls", region: "africa", lang: "en", country: "NG", color: "#E30613", category: "news" },
  { id: "hls-ln247", label: "LN247", hlsUrl: "https://go5lmb6oyawb-hls-live.5centscdn.com/station/3dfd3752af3d7aec5c53992c2da3a316.sdp/playlist.m3u8", type: "hls", region: "africa", lang: "en", country: "NG", color: "#003DA6", category: "news" },
  { id: "hls-newscentral", label: "NEWS CENTRAL", hlsUrl: "https://wf.newscentral.ng:8443/hls/stream.m3u8", type: "hls", region: "africa", lang: "en", country: "NG", color: "#0055A4", category: "news" },

  // ═══════════════════════════════════════
  // SOUTH AFRICA (ZA) — HLS
  // ═══════════════════════════════════════
  { id: "hls-sabcnews", label: "SABC NEWS", hlsUrl: "https://sabconetanw.cdn.mangomolo.com/news/smil:news.stream.smil/master.m3u8", type: "hls", region: "africa", lang: "en", country: "ZA", color: "#003DA6", category: "news" },
  { id: "hls-wildearth", label: "WILDEARTH", hlsUrl: "https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01290-wildearth-oando/playlist.m3u8", type: "hls", region: "africa", lang: "en", country: "ZA", color: "#00843D", category: "documentary" },

  // ═══════════════════════════════════════
  // AUSTRALIA (AU) — HLS
  // ═══════════════════════════════════════
  { id: "hls-abcnews-au", label: "ABC NEWS AU", hlsUrl: "https://abc-news-dmd-streams-1.akamaized.net/out/v1/701126012d044971b3fa89406a440133/index.m3u8", type: "hls", region: "global", lang: "en", country: "AU", color: "#00843D", category: "news" },
  { id: "hls-ausbiz", label: "AUSBIZ TV", hlsUrl: "https://d9quh89lh7dtw.cloudfront.net/public-output/index.m3u8", type: "hls", region: "global", lang: "en", country: "AU", color: "#0055A4", category: "business" },
  { id: "hls-skynews-au", label: "SKY NEWS AU", hlsUrl: "https://skynewsau-live.akamaized.net/hls/live/2002689/skynewsau-extra1/master.m3u8", type: "hls", region: "global", lang: "en", country: "AU", color: "#E30613", category: "news" },

  // ═══════════════════════════════════════
  // CANADA (CA) — HLS
  // ═══════════════════════════════════════
  { id: "hls-cpac", label: "CPAC", hlsUrl: "https://d7z3qjdsxbwoq.cloudfront.net/groupa/live/f9809cea-1e07-47cd-a94d-2ddd3e1351db/live.isml/.m3u8", type: "hls", region: "global", lang: "en", country: "CA", color: "#E30613", category: "news" },
  { id: "hls-citynews-to", label: "CITYNEWS TORONTO", hlsUrl: "https://citynewsregional.akamaized.net/hls/live/1024052/Regional_Live_7/master.m3u8", type: "hls", region: "global", lang: "en", country: "CA", color: "#FF6600", category: "news" },
  { id: "hls-ici-rdi", label: "ICI RDI", hlsUrl: "https://rcavlive.akamaized.net/hls/live/704025/xcanrdi/master.m3u8", type: "hls", region: "global", lang: "fr", country: "CA", color: "#003DA6", category: "news" },

  // ═══════════════════════════════════════
  // POLAND (PL) — HLS
  // ═══════════════════════════════════════
  { id: "hls-tvpinfo", label: "TVP INFO", hlsUrl: "https://lowa8026-cmyk.github.io/tvpvod/399699.m3u8", type: "hls", region: "eu", lang: "pl", country: "PL", color: "#E30613", category: "news" },
  { id: "hls-polsatnews", label: "POLSAT NEWS", hlsUrl: "https://cdn-s-lb2.pluscdn.pl/lv/1517830/349/hls/f03a76f3/masterlist.m3u8", type: "hls", region: "eu", lang: "pl", country: "PL", color: "#003DA6", category: "news" },
  { id: "hls-tvbiznesowa", label: "TV BIZNESOWA", hlsUrl: "https://s-pl-01.mediatool.tv/playout/tbpl-abr/index.m3u8", type: "hls", region: "eu", lang: "pl", country: "PL", color: "#0055A4", category: "business" },
  { id: "hls-echo24", label: "ECHO24", hlsUrl: "https://echo24new.pl/LiveAppStreamECHO24/streams/GL0VksiIgQUS1672825288490.m3u8", type: "hls", region: "eu", lang: "pl", country: "PL", color: "#FF6600", category: "news" },

  // ═══════════════════════════════════════
  // UKRAINE (UA) — HLS
  // ═══════════════════════════════════════
  { id: "hls-24kanal", label: "24 КАНАЛ", hlsUrl: "https://streamvideol1.luxnet.ua/news24/smil:news24.stream.smil/playlist.m3u8", type: "hls", region: "eu", lang: "uk", country: "UA", color: "#FFD700", category: "news" },
  { id: "hls-espreso", label: "ESPRESO TV", hlsUrl: "https://liveovh009.cda.pl/2mwlMj_cpciQwY9XKkuwooIeujskIie828C5uElA/1760154894/24372638/enc024/espresotvraw/espresotvraw.m3u8", type: "hls", region: "eu", lang: "uk", country: "UA", color: "#003DA6", category: "news" },
  { id: "hls-freedom-ua", label: "FREEDOM", hlsUrl: "https://freedom.cdn-01.cosmonova.net.ua/mobile-app/main/freedom/master.m3u8", type: "hls", region: "eu", lang: "uk", country: "UA", color: "#0055A4", category: "news" },

  // ═══════════════════════════════════════
  // IRAN (IR) — HLS
  // ═══════════════════════════════════════
  { id: "hls-presstv", label: "PRESS TV", hlsUrl: "https://live.presstv.ir/hls/presstv.m3u8", type: "hls", region: "mideast", lang: "en", country: "IR", color: "#00843D", category: "news" },
  { id: "hls-presstv-fr", label: "PRESS TV FR", hlsUrl: "https://live4.presstv.ir/live/smil:presstvfr.smil/playlist.m3u8", type: "hls", region: "mideast", lang: "fr", country: "IR", color: "#003DA6", category: "news" },
  { id: "hls-alalam", label: "AL ALAM", hlsUrl: "https://live2.alalam.ir/alalam.m3u8", type: "hls", region: "mideast", lang: "ar", country: "IR", color: "#E30613", category: "news" },

  // ═══════════════════════════════════════
  // IRAQ (IQ) — HLS
  // ═══════════════════════════════════════
  { id: "hls-aliraqia", label: "AL IRAQIA", hlsUrl: "https://cdn.catiacast.video/abr/8d2ffb0aba244e8d9101a9488a7daa05/playlist.m3u8", type: "hls", region: "mideast", lang: "ar", country: "IQ", color: "#003DA6", category: "news" },
  { id: "hls-aliraqia-news", label: "AL IRAQIA NEWS", hlsUrl: "https://cdn.catiacast.video/abr/78054972db7708422595bc96c6e024ac/playlist.m3u8", type: "hls", region: "mideast", lang: "ar", country: "IQ", color: "#E30613", category: "news" },
  { id: "hls-sharqiya-news", label: "AL-SHARQIYA NEWS", hlsUrl: "https://5d94523502c2d.streamlock.net/alsharqiyalive/mystream/playlist.m3u8", type: "hls", region: "mideast", lang: "ar", country: "IQ", color: "#0055A4", category: "news" },
  { id: "hls-inews-iq", label: "INEWS TV", hlsUrl: "https://live.i-news.tv/hls/stream.m3u8", type: "hls", region: "mideast", lang: "ar", country: "IQ", color: "#FF6600", category: "news" },
  { id: "hls-kurdsat-news", label: "KURDSAT NEWS", hlsUrl: "https://hlspackager.akamaized.net/live/DB/KURDSAT_NEWS/HLS/KURDSAT_NEWS.m3u8", type: "hls", region: "mideast", lang: "ku", country: "IQ", color: "#00843D", category: "news" },

  // ═══════════════════════════════════════
  // NETHERLANDS (NL) — HLS
  // ═══════════════════════════════════════
  { id: "hls-tweedekamer", label: "TWEEDE KAMER", hlsUrl: "https://livestreaming.b67buv2.tweedekamer.nl/live/plenairezaal/index.m3u8?hd=1&keyframes=1&subtitles=live", type: "hls", region: "eu", lang: "nl", country: "NL", color: "#FF6600", category: "news" },

  // ═══════════════════════════════════════
  // SWEDEN (SE) — HLS
  // ═══════════════════════════════════════
  { id: "hls-expressen", label: "EXPRESSEN TV", hlsUrl: "https://cdn0-03837-liveedge0.dna.ip-only.net/03837-liveedge0/smil:03837-tx2/playlist.m3u8", type: "hls", region: "eu", lang: "sv", country: "SE", color: "#E30613", category: "news" },

  // ═══════════════════════════════════════
  // NORWAY (NO) — HLS
  // ═══════════════════════════════════════
  { id: "hls-nrk1", label: "NRK 1", hlsUrl: "https://nrk-live-no.akamaized.net/nrk1/muxed.m3u8", type: "hls", region: "eu", lang: "no", country: "NO", color: "#E30613", category: "news" },
  { id: "hls-nrk2", label: "NRK 2", hlsUrl: "https://nrk-live-no.akamaized.net/nrk2/muxed.m3u8", type: "hls", region: "eu", lang: "no", country: "NO", color: "#003DA6", category: "news" },

  // ═══════════════════════════════════════
  // GREECE (GR) — HLS
  // ═══════════════════════════════════════
  { id: "hls-vouli", label: "VOULI TV", hlsUrl: "https://streamer-cache.grnet.gr/parliament/parltv.sdp/master.m3u8", type: "hls", region: "eu", lang: "el", country: "GR", color: "#0055A4", category: "news" },

  // ═══════════════════════════════════════
  // ROMANIA (RO) — HLS
  // ═══════════════════════════════════════
  { id: "hls-digi24", label: "DIGI 24", hlsUrl: "https://edge-ar.rcs-rds.ro/digi24ar/index.m3u8", type: "hls", region: "eu", lang: "ro", country: "RO", color: "#003DA6", category: "news" },
  { id: "hls-alephnews", label: "ALEPH NEWS", hlsUrl: "https://stream-aleph.m.ro/Aleph/ngrp:Alephnewsmain.stream_all/playlist.m3u8", type: "hls", region: "eu", lang: "ro", country: "RO", color: "#0055A4", category: "news" },
  { id: "hls-alephbiz", label: "ALEPH BUSINESS", hlsUrl: "https://streamw.m.ro/Aleph/ngrp:Alephbiz.stream_all/playlist.m3u8", type: "hls", region: "eu", lang: "ro", country: "RO", color: "#2800D7", category: "business" },
  { id: "hls-romaniatv", label: "ROMANIA TV", hlsUrl: "https://livestream.romaniatv.net/clients/romaniatv/playlist.m3u8", type: "hls", region: "eu", lang: "ro", country: "RO", color: "#E30613", category: "news" },
  { id: "hls-profitnews", label: "PROFIT NEWS", hlsUrl: "https://stream1.profit.ro:1945/profit/livestream/playlist.m3u8", type: "hls", region: "eu", lang: "ro", country: "RO", color: "#00843D", category: "business" },

  // ═══════════════════════════════════════
  // PORTUGAL (PT) — HLS
  // ═══════════════════════════════════════
  { id: "hls-rtpnoticias", label: "RTP NOTÍCIAS", hlsUrl: "https://streaming-live.rtp.pt/livetvhlsDVR/rtpnHDdvr.smil/playlist.m3u8", type: "hls", region: "eu", lang: "pt", country: "PT", color: "#003DA6", category: "news" },
  { id: "hls-sicnoticias", label: "SIC NOTÍCIAS", hlsUrl: "https://d277k9d1h9dro4.cloudfront.net/out/v1/293e7c3464824cbd8818ab8e49dc5fe9/index.m3u8", type: "hls", region: "eu", lang: "pt", country: "PT", color: "#E30613", category: "news" },
  { id: "hls-artv", label: "ARTV PARLAMENTO", hlsUrl: "https://playout172.livextend.cloud/liveiframe/_definst_/liveartvabr/playlist.m3u8", type: "hls", region: "eu", lang: "pt", country: "PT", color: "#0055A4", category: "news" },

  // ═══════════════════════════════════════
  // PHILIPPINES (PH) — HLS
  // ═══════════════════════════════════════
  { id: "hls-ptv-ph", label: "PTV", hlsUrl: "https://ythls.armelin.one/channel/UCJCUbMaY593_4SN1QPG7NFQ.m3u8", type: "hls", region: "asia", lang: "en", country: "PH", color: "#003DA6", category: "news" },

  // ═══════════════════════════════════════
  // MALAYSIA (MY) — HLS
  // ═══════════════════════════════════════
  { id: "hls-beritartm", label: "BERITA RTM", hlsUrl: "https://d25tgymtnqzu8s.cloudfront.net/smil:berita/playlist.m3u8?id=5", type: "hls", region: "asia", lang: "ms", country: "MY", color: "#003DA6", category: "news" },
  { id: "hls-parlimen-rakyat", label: "PARLIMEN RAKYAT", hlsUrl: "https://d25tgymtnqzu8s.cloudfront.net/smil:rakyat/playlist.m3u8?id=7", type: "hls", region: "asia", lang: "ms", country: "MY", color: "#FFD700", category: "news" },

  // ═══════════════════════════════════════
  // INDONESIA (ID) — HLS
  // ═══════════════════════════════════════
  { id: "hls-cnbc-id", label: "CNBC INDONESIA", hlsUrl: "https://live.cnbcindonesia.com/livecnbc/smil:cnbctv.smil/master.m3u8", type: "hls", region: "asia", lang: "id", country: "ID", color: "#005594", category: "business" },
  { id: "hls-metrotv", label: "METRO TV", hlsUrl: "https://edge.medcom.id/live-edge/smil:metro.smil/playlist.m3u8", type: "hls", region: "asia", lang: "id", country: "ID", color: "#003DA6", category: "news" },
  { id: "hls-tvri", label: "TVRI", hlsUrl: "https://ott-balancer.tvri.go.id/live/eds/Nasional/hls/Nasional.m3u8", type: "hls", region: "asia", lang: "id", country: "ID", color: "#E30613", category: "news" },
  { id: "hls-tvriworld", label: "TVRI WORLD", hlsUrl: "https://ott-balancer.tvri.go.id/live/eds/TVRIWorld/hls/TVRIWorld.m3u8", type: "hls", region: "asia", lang: "id", country: "ID", color: "#0055A4", category: "news" },
  { id: "hls-parlemen-id", label: "TVR PARLEMEN", hlsUrl: "https://ssv1.dpr.go.id/golive/livestream/playlist.m3u8", type: "hls", region: "asia", lang: "id", country: "ID", color: "#FFD700", category: "news" },

  // ═══════════════════════════════════════
  // THAILAND (TH) — HLS
  // ═══════════════════════════════════════
  { id: "hls-thaipbs", label: "THAI PBS", hlsUrl: "https://thaipbs-live.cdn.byteark.com/live/playlist.m3u8", type: "hls", region: "asia", lang: "th", country: "TH", color: "#003DA6", category: "news" },
  { id: "hls-topnews-th", label: "TOP NEWS", hlsUrl: "https://live.topnews.co.th/hls/topnews_a_720.m3u8", type: "hls", region: "asia", lang: "th", country: "TH", color: "#E30613", category: "news" },
  { id: "hls-parliament-th", label: "PARLIAMENT TV", hlsUrl: "https://tv-live.tpchannel.org/live/tv.m3u8", type: "hls", region: "asia", lang: "th", country: "TH", color: "#FFD700", category: "news" },

  // ═══════════════════════════════════════
  // VIETNAM (VN) — HLS
  // ═══════════════════════════════════════
  { id: "hls-vtv1", label: "VTV1", hlsUrl: "https://liveh12.vtvprime.vn/hls/VTV1_HD/index.m3u8", type: "hls", region: "asia", lang: "vi", country: "VN", color: "#E30613", category: "news" },
  { id: "hls-qpvn", label: "QPVN", hlsUrl: "https://qpvn.vn/live/qpvn/master.m3u8", type: "hls", region: "asia", lang: "vi", country: "VN", color: "#003DA6", category: "news" },

  // ═══════════════════════════════════════
  // INDIA (IN) — HLS (iptv-org sourced)
  // ═══════════════════════════════════════
  { id: "hls-aajtak", label: "AAJ TAK", hlsUrl: "https://feeds.intoday.in/aajtak/api/aajtakhd/master.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", color: "#E30613", category: "news" },
  { id: "hls-abpnews", label: "ABP NEWS", hlsUrl: "https://d2l4ar6y3mrs4k.cloudfront.net/live-streaming/abpnews-livetv/master.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", color: "#FF6600", category: "news" },
  { id: "hls-indiatv", label: "INDIA TV", hlsUrl: "https://pl-indiatvnews.akamaized.net/out/v1/db79179b608641ceaa5a4d0dd0dca8da/index.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", color: "#003DA6", category: "news" },
  { id: "hls-news18", label: "NEWS18 INDIA", hlsUrl: "https://n18syndication.akamaized.net/bpk-tv/News18_India_NW18_MOB/output01/master.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", color: "#0055A4", category: "news" },
  { id: "hls-cnbcawaaz", label: "CNBC AWAAZ", hlsUrl: "https://n18syndication.akamaized.net/bpk-tv/CNBC_Awaaz_NW18_MOB/output01/master.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", color: "#005594", category: "business" },
  { id: "hls-ndtvprofit", label: "NDTV PROFIT", hlsUrl: "https://ndtvprofit.akamaized.net/hls/live/2107404/ndtvprofit/master_1.m3u8", type: "hls", region: "asia", lang: "en", country: "IN", color: "#00843D", category: "business" },
  { id: "hls-zeenews", label: "ZEE NEWS", hlsUrl: "https://dknttpxmr0dwf.cloudfront.net/index_57.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", color: "#E30613", category: "news" },

  // ═══════════════════════════════════════
  // TURKEY (TR) — HLS Extra (iptv-org sourced)
  // ═══════════════════════════════════════
  { id: "hls-halktv", label: "HALK TV", hlsUrl: "https://halktv-live.daioncdn.net/halktv/halktv.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#E30613", category: "news" },
  { id: "hls-tele1", label: "TELE 1", hlsUrl: "https://tele1-live.ercdn.net/tele1/tele1.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#FF6600", category: "news" },
  { id: "hls-kanald", label: "KANAL D", hlsUrl: "https://demiroren.daioncdn.net/kanald/kanald.m3u8?app=kanald_web&ce=3", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#003DA6", category: "news" },
  { id: "hls-atv", label: "ATV", hlsUrl: "https://trkvz-live.ercdn.net/tv2/tv2.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#FF0000", category: "news" },
  { id: "hls-teve2", label: "TEVE2", hlsUrl: "https://demiroren-live.daioncdn.net/teve2/teve2.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#0055A4", category: "news" },
  { id: "hls-trt1", label: "TRT 1", hlsUrl: "https://tv-trt1.medya.trt.com.tr/master.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#E30613", category: "news" },
  { id: "hls-tbmm", label: "TBMM TV", hlsUrl: "https://meclistv-live.ercdn.net/meclistv/meclistv.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#004B87", category: "news" },

  // ═══════════════════════════════════════
  // SAUDI ARABIA (SA) — HLS Extra
  // ═══════════════════════════════════════
  { id: "hls-alhadath", label: "AL HADATH", hlsUrl: "https://shd-gcp-live.edgenextcdn.net/live/bitmovin-hadath/2ff87ec4c2f3ede35295a20637d9f8fd/index.m3u8", type: "hls", region: "mideast", lang: "ar", country: "SA", color: "#B8860B", category: "news" },
  { id: "hls-alarabiya-en", label: "AL ARABIYA EN", hlsUrl: "https://live.alarabiya.net/alarabiapublish/english/playlist_dvr.m3u8", type: "hls", region: "mideast", lang: "en", country: "SA", color: "#B8860B", category: "news" },
  { id: "hls-cnbcarabiya", label: "CNBC ARABIYA", hlsUrl: "https://cnbc-live.akamaized.net/cnbc/master.m3u8", type: "hls", region: "mideast", lang: "ar", country: "AE", color: "#005594", category: "business" },

  // ═══════════════════════════════════════
  // QATAR (QA) — HLS Extra (Al Jazeera direct HLS)
  // ═══════════════════════════════════════
  { id: "hls-aja-hq", label: "الجزيرة HQ", hlsUrl: "https://live-hls-apps-aja-fa.getaj.net/AJA/index.m3u8", type: "hls", region: "mideast", lang: "ar", country: "QA", color: "#D4AA00", category: "news" },
  { id: "hls-aje-hq", label: "AJ ENGLISH HQ", hlsUrl: "https://live-hls-apps-aje-fa.getaj.net/AJE/index.m3u8", type: "hls", region: "global", lang: "en", country: "QA", color: "#D4AA00", category: "news" },
  { id: "hls-ajm", label: "AJ MUBASHER", hlsUrl: "https://live-hls-apps-ajm-fa.getaj.net/AJM/index.m3u8", type: "hls", region: "mideast", lang: "ar", country: "QA", color: "#D4AA00", category: "news" },

  // ═══════════════════════════════════════
  // SOUTH KOREA (KR) — HLS Extra
  // ═══════════════════════════════════════
  { id: "hls-ytn", label: "YTN", hlsUrl: "http://202.60.106.14:8080/214/playlist.m3u8", type: "hls", region: "asia", lang: "ko", country: "KR", color: "#003DA6", category: "news" },

  // ═══════════════════════════════════════
  // USA (US) — HLS Extra
  // ═══════════════════════════════════════
  { id: "hls-foxweather", label: "FOX WEATHER", hlsUrl: "https://247wlive.foxweather.com/stream/index.m3u8", type: "hls", region: "us", lang: "en", country: "US", color: "#0055A4", category: "news" },
  { id: "hls-livenow", label: "LIVENOW FROM FOX", hlsUrl: "https://fox-foxnewsnow-vizio.amagi.tv/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", color: "#003DA6", category: "news" },
  { id: "hls-newsy", label: "NEWSY", hlsUrl: "https://547f72e6652371c3.mediapackage.us-east-1.amazonaws.com/out/v1/e3e6e29095844c4ba7d887f01e44a5ef/index.m3u8", type: "hls", region: "us", lang: "en", country: "US", color: "#0055A4", category: "news" },

  // ═══════════════════════════════════════
  // UK (GB) — HLS Extra
  // ═══════════════════════════════════════
  { id: "hls-iranintl", label: "IRAN INTL", hlsUrl: "https://live.livetvstream.co.uk/LS-63503-4/index.m3u8", type: "hls", region: "mideast", lang: "fa", country: "GB", color: "#00843D", category: "news" },

  // ═══════════════════════════════════════
  // FRANCE (FR) — HLS Extra
  // ═══════════════════════════════════════
  { id: "hls-france24en", label: "FRANCE 24 EN", hlsUrl: "https://live.france24.com/hls/live/2037218/F24_EN_HI_HLS/master_5000.m3u8", type: "hls", region: "global", lang: "en", country: "FR", color: "#00A1E4", category: "news" },
  { id: "hls-france24ar", label: "FRANCE 24 AR", hlsUrl: "https://live.france24.com/hls/live/2037222/F24_AR_HI_HLS/master_5000.m3u8", type: "hls", region: "mideast", lang: "ar", country: "FR", color: "#00A1E4", category: "news" },
  { id: "hls-france24es", label: "FRANCE 24 ES", hlsUrl: "https://live.france24.com/hls/live/2037220/F24_ES_HI_HLS/master_5000.m3u8", type: "hls", region: "latam", lang: "es", country: "FR", color: "#00A1E4", category: "news" },
  { id: "hls-tv5monde", label: "TV5MONDE INFO", hlsUrl: "https://ott.tv5monde.com/Content/HLS/Live/channel(info)/variant.m3u8", type: "hls", region: "global", lang: "fr", country: "FR", color: "#8B0000", category: "news" },

  // ═══════════════════════════════════════
  // GERMANY (DE) — HLS Extra (DW multi-language)
  // ═══════════════════════════════════════
  { id: "hls-dwen", label: "DW ENGLISH", hlsUrl: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/master.m3u8", type: "hls", region: "global", lang: "en", country: "DE", color: "#0077B6", category: "news" },
  { id: "hls-dwar", label: "DW ARABIC", hlsUrl: "https://dwamdstream103.akamaized.net/hls/live/2015526/dwstream103/master.m3u8", type: "hls", region: "mideast", lang: "ar", country: "DE", color: "#0077B6", category: "news" },
  { id: "hls-dwes", label: "DW ESPAÑOL", hlsUrl: "https://dwamdstream104.akamaized.net/hls/live/2015530/dwstream104/master.m3u8", type: "hls", region: "latam", lang: "es", country: "DE", color: "#0077B6", category: "news" },

  // ═══════════════════════════════════════
  // SPAIN (ES) — HLS Extra
  // ═══════════════════════════════════════
  { id: "hls-3catinfo", label: "3CAT INFO", hlsUrl: "https://directes-tv-int.3catdirectes.cat/live-origin/canal324-hls/master.m3u8", type: "hls", region: "eu", lang: "ca", country: "ES", color: "#003DA6", category: "news" },

  // ═══════════════════════════════════════
  // RUSSIA (RU) — HLS Extra
  // ═══════════════════════════════════════
  { id: "hls-izvestia", label: "ИЗВЕСТИЯ", hlsUrl: "http://igi-hls.cdnvideo.ru/igi/igi_tcode/playlist.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", color: "#003DA6", category: "news" },

  // ═══════════════════════════════════════
  // IRAQ (IQ) — HLS Extra
  // ═══════════════════════════════════════
  { id: "hls-kurdistan24", label: "KURDISTAN 24", hlsUrl: "https://d1x82nydcxndze.cloudfront.net/live/index.m3u8", type: "hls", region: "mideast", lang: "ku", country: "IQ", color: "#FFD700", category: "news" },

  // ═══════════════════════════════════════
  // COLOMBIA (CO) — HLS
  // ═══════════════════════════════════════
  { id: "hls-cablenoticias", label: "CABLENOTICIAS", hlsUrl: "https://5ea86ddd14ce7.streamlock.net/live/cable09061970/playlist.m3u8", type: "hls", region: "latam", lang: "es", country: "CO", color: "#FFD700", category: "news" },

  // ═══════════════════════════════════════
  // PERU (PE) — HLS
  // ═══════════════════════════════════════
  { id: "hls-rpptv", label: "RPP TV", hlsUrl: "https://redirector.rudo.video/hls-video/567ffde3fa319fadf3419efda25619456231dfea/rpptv/rpptv.smil/playlist.m3u8", type: "hls", region: "latam", lang: "es", country: "PE", color: "#E30613", category: "news" },
  { id: "hls-tvperu", label: "TV PERU", hlsUrl: "https://cdnhd.iblups.com/hls/777b4d4cc0984575a7d14f6ee57dbcaf7.m3u8", type: "hls", region: "latam", lang: "es", country: "PE", color: "#003DA6", category: "news" },
  { id: "hls-tvperu-noticias", label: "TV PERU NOTICIAS", hlsUrl: "https://cdnhd.iblups.com/hls/902c1a0395264f269f1160efa00660e47.m3u8", type: "hls", region: "latam", lang: "es", country: "PE", color: "#0055A4", category: "news" },
];

/**
 * Get channels filtered by locale.
 * Returns: all international (en) + channels matching user's language.
 */
export function getChannelsByLocale(locale: string): LiveChannel[] {
  const intl = LIVE_CHANNELS.filter((ch) => ch.lang === "en");
  if (locale === "en") return intl;

  const localized = LIVE_CHANNELS.filter((ch) => ch.lang === locale);
  return [...localized, ...intl];
}

/** Get channels filtered by country code */
export function getChannelsByCountry(countryCode: string): LiveChannel[] {
  return LIVE_CHANNELS.filter((ch) => ch.country?.toUpperCase() === countryCode.toUpperCase());
}

/** Get all unique countries that have channels */
export function getAvailableCountries(): Array<{ code: string; name: string; count: number }> {
  const countryMap = new Map<string, number>();
  LIVE_CHANNELS.forEach((ch) => {
    if (ch.country) {
      countryMap.set(ch.country, (countryMap.get(ch.country) || 0) + 1);
    }
  });

  const COUNTRY_NAMES: Record<string, string> = {
    US: "USA", GB: "UK", TR: "Turkey", QA: "Qatar", AE: "UAE", SA: "Saudi Arabia",
    DE: "Germany", FR: "France", ES: "Spain", CL: "Chile", JP: "Japan",
    KR: "Korea", RU: "Russia", CN: "China", IN: "India",
    IT: "Italy", BR: "Brazil", MX: "Mexico", AR: "Argentina", IL: "Israel",
    EG: "Egypt", PK: "Pakistan", NG: "Nigeria", ZA: "South Africa", AU: "Australia",
    CA: "Canada", PL: "Poland", UA: "Ukraine", IR: "Iran", IQ: "Iraq",
    NL: "Netherlands", SE: "Sweden", NO: "Norway", GR: "Greece", RO: "Romania",
    PT: "Portugal", PH: "Philippines", MY: "Malaysia", ID: "Indonesia", TH: "Thailand",
    VN: "Vietnam", CO: "Colombia", PE: "Peru",
  };

  return [...countryMap.entries()]
    .map(([code, count]) => ({ code, name: COUNTRY_NAMES[code] || code, count }))
    .sort((a, b) => b.count - a.count);
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
