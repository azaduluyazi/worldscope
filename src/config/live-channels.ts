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
