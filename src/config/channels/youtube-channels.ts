import type { LiveChannel } from "./types";

export const YOUTUBE_CHANNELS: LiveChannel[] = [
  // ═══════════════════════════════════════════════════════════════
  // INTERNATIONAL — English (EN)
  // ═══════════════════════════════════════════════════════════════
  { id: "aljazeera-en", label: "AL JAZEERA", channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg", videoId: "gCNeDWCI0vo", type: "youtube", region: "global", lang: "en", color: "#D4AA00", category: "news", variantAffinity: ["world", "conflict"] },
  { id: "france24-en", label: "FRANCE 24", channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg", videoId: "h3MuIUNCCzI", type: "youtube", region: "eu", lang: "en", color: "#00A1E4", category: "news" },
  { id: "dw-en", label: "DW NEWS", channelId: "UCknLrEdhRCp1aegoMqRaCZg", videoId: "GE_SfNbYa-s", type: "youtube", region: "eu", lang: "en", color: "#0077B6", category: "news" },
  { id: "skynews", label: "SKY NEWS", channelId: "UCoMdktPbSTixAyNGwb-UYkQ", videoId: "9Auq9mYxFEE", type: "youtube", region: "global", lang: "en", color: "#C41230", category: "news" },
  { id: "euronews-en", label: "EURONEWS", channelId: "UCW2QcKZiU8aUGg4yxCIditg", videoId: "pykpO5kQJ98", type: "youtube", region: "eu", lang: "en", color: "#003DA6", category: "news" },
  { id: "cnbc", label: "CNBC", channelId: "UCvJJ_dzjViJCoLf5uKUTwoA", videoId: "9NyxcX3rhQs", type: "youtube", region: "us", lang: "en", color: "#005594", category: "business", variantAffinity: ["finance"] },
  { id: "bloomberg", label: "BLOOMBERG", channelId: "UCIALMKvObZNtJ68-rmLjXoA", videoId: "oPmFnOCSLyA", type: "youtube", region: "us", lang: "en", color: "#2800D7", category: "business", variantAffinity: ["finance"] },
  { id: "trtworld", label: "TRT WORLD", channelId: "UC7fWeaHhqgM4Ry-RMpM2YYw", type: "youtube", region: "global", lang: "en", color: "#E30613", category: "news" },
  { id: "wion", label: "WION", channelId: "UC_gUM8rL-Lrg6O3adPW9K1g", type: "youtube", region: "asia", lang: "en", color: "#FF6B00", category: "news" },
  { id: "cna", label: "CNA", channelId: "UC83jt4dlz1Gjl58fzQrrKZg", type: "youtube", region: "asia", lang: "en", color: "#E50000", category: "news" },
  { id: "abcaus", label: "ABC AU", channelId: "UCVgO39Bk5sMo66-6o6Spn6Q", type: "youtube", region: "global", lang: "en", color: "#00843D", category: "news" },
  { id: "nhkworld", label: "NHK WORLD", channelId: "UCSPEjw8F2nQDtmUKPFNF7_A", type: "youtube", region: "asia", lang: "en", color: "#E60012", category: "news" },
  { id: "arirang", label: "ARIRANG", channelId: "UC-PHIZjV-oX8H7zD1cCN2NQ", type: "youtube", region: "asia", lang: "en", color: "#0033A0", category: "news" },
  { id: "cgtn-en", label: "CGTN", channelId: "UCgrNz-aDmcr2uuto8_DL2jg", type: "youtube", region: "asia", lang: "en", color: "#D71920", category: "news" },
  { id: "ndtv", label: "NDTV", channelId: "UCfR7gLhMBoeYDGEaXsYb3Kw", type: "youtube", region: "asia", lang: "en", color: "#FF4500", category: "news" },

  // ═══════════════════════════════════════════════════════════════
  // US NETWORKS — English (EN) [NEW]
  // ═══════════════════════════════════════════════════════════════
  { id: "abcnews-live", label: "ABC NEWS LIVE", channelId: "UCBi2mrWuNuyYy4gbM6fU18Q", type: "youtube", region: "us", lang: "en", country: "US", color: "#000000", category: "news" },
  { id: "cbsnews-247", label: "CBS NEWS 24/7", channelId: "UC8p1vwvWtl6T73JiExfWs1g", type: "youtube", region: "us", lang: "en", country: "US", color: "#003DA6", category: "news" },
  { id: "nbcnews-now", label: "NBC NEWS NOW", channelId: "UCeY0bbntWzzVIaj2z3QigXg", type: "youtube", region: "us", lang: "en", country: "US", color: "#E51837", category: "news" },
  { id: "fox-livenow", label: "FOX LiveNOW", channelId: "UCXIJgqnII2ZOINSValEdDCA", type: "youtube", region: "us", lang: "en", country: "US", color: "#003DA6", category: "news" },
  { id: "msnbc", label: "MSNBC", channelId: "UCaXkIU1QidjPwiAYu6GcHjg", type: "youtube", region: "us", lang: "en", country: "US", color: "#0072CE", category: "news" },
  { id: "cspan", label: "C-SPAN", channelId: "UCb2C_jSMKEDL8v7M9BLOsUQ", type: "youtube", region: "us", lang: "en", country: "US", color: "#003DA6", category: "news" },
  { id: "newsnation", label: "NEWSNATION", channelId: "UCsdRN9gMdGR89FLuEUfWMrQ", type: "youtube", region: "us", lang: "en", country: "US", color: "#0055A4", category: "news" },

  // ═══════════════════════════════════════════════════════════════
  // TURKISH (TR)
  // ═══════════════════════════════════════════════════════════════
  { id: "trthaber", label: "TRT HABER", channelId: "UCBgTP2LOFVPmq15W-RH-WXA", type: "youtube", region: "tr", lang: "tr", color: "#E30613", category: "news" },
  { id: "cnnturk", label: "CNN TURK", channelId: "UCV6zcRug6Hqp1UX_FdyUeBg", type: "youtube", region: "tr", lang: "tr", color: "#CC0000", category: "news" },
  { id: "ntv", label: "NTV", channelId: "UCfR7gLhMBoeYDGEaXsYb3Kw", type: "youtube", region: "tr", lang: "tr", color: "#003DA6", category: "news" },
  { id: "haberglobal", label: "HABER GLOBAL", channelId: "UCtc-a9ZUIg0_5HpsPxEO7Qg", type: "youtube", region: "tr", lang: "tr", color: "#1E90FF", category: "news" },
  { id: "ahaber", label: "A HABER", channelId: "UCKQhfw-lzz0uKnE1fY1PsAA", type: "youtube", region: "tr", lang: "tr", color: "#FF0000", category: "news" },
  { id: "haberturk", label: "HABERTURK", channelId: "UCn6dNfiRE_Xunu7iMyvD7AA", type: "youtube", region: "tr", lang: "tr", color: "#0055A4", category: "news" },
  { id: "tgrthaber", label: "TGRT HABER", channelId: "UCLmXd2WwLBMGWelah1NjEaA", type: "youtube", region: "tr", lang: "tr", color: "#8B0000", category: "news" },

  // --- Turkish NEW ---
  { id: "sozcu-tv", label: "SOZCU TV", channelId: "UCp-Jf6-URiZaD2FW5YxDVew", type: "youtube", region: "tr", lang: "tr", country: "TR", color: "#E30613", category: "news" },
  { id: "tv360", label: "TV360", channelId: "UC7Eg-RBfmirkhM0TpV03kHg", type: "youtube", region: "tr", lang: "tr", country: "TR", color: "#FF6600", category: "news" },
  { id: "halktv-yt", label: "HALK TV", channelId: "UCT2WjyKBB8CBAqUqj3cz7Hw", type: "youtube", region: "tr", lang: "tr", country: "TR", color: "#E30613", category: "news" },
  { id: "tele1-yt", label: "TELE 1", channelId: "UCqAKwjZTmaPbMiNDrQ_r3Eg", type: "youtube", region: "tr", lang: "tr", country: "TR", color: "#FF6600", category: "news" },

  // ═══════════════════════════════════════════════════════════════
  // ARABIC (AR)
  // ═══════════════════════════════════════════════════════════════
  { id: "aljazeera-ar", label: "\u0627\u0644\u062C\u0632\u064A\u0631\u0629", channelId: "UCfiwzLy-8yKzIbsmZTzxDgw", type: "youtube", region: "mideast", lang: "ar", color: "#D4AA00", category: "news", variantAffinity: ["world", "conflict"] },
  { id: "alarabiya", label: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", channelId: "UCWwJMD-04gJBFOxsPjRcPOg", type: "youtube", region: "mideast", lang: "ar", color: "#B8860B", category: "news" },
  { id: "skynews-ar", label: "\u0633\u0643\u0627\u064A \u0646\u064A\u0648\u0632 \u0639\u0631\u0628\u064A\u0629", channelId: "UC1gJ5YOHoVOkpcpszq-oTNQ", type: "youtube", region: "mideast", lang: "ar", color: "#0072BC", category: "news" },
  { id: "france24-ar", label: "\u0641\u0631\u0627\u0646\u0633 24", channelId: "UCdTyuXgmJkG_O8_75eqej-w", type: "youtube", region: "mideast", lang: "ar", color: "#00A1E4", category: "news" },
  { id: "bbc-ar", label: "BBC \u0639\u0631\u0628\u064A", channelId: "UCH1oRy1dINbMVp3UFWrKP0w", type: "youtube", region: "mideast", lang: "ar", color: "#BB1919", category: "news" },
  { id: "ajmubasher", label: "\u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0645\u0628\u0627\u0634\u0631", channelId: "UCbqf50YqCFdSBKbKSMR-l5A", type: "youtube", region: "mideast", lang: "ar", color: "#D4AA00", category: "news" },

  // --- Arabic NEW ---
  { id: "rt-arabic", label: "RT ARABIC", channelId: "UCnBKcM0i0BQ6_DJF4-xcuYA", type: "youtube", region: "mideast", lang: "ar", color: "#00843D", category: "news" },
  { id: "trt-arabic", label: "TRT ARABIC", channelId: "UC8BxQJXNP_Pp0_g8YcULhSA", type: "youtube", region: "mideast", lang: "ar", color: "#E30613", category: "news" },
  { id: "almayadeen", label: "AL MAYADEEN", channelId: "UCXKLwAkMJmN6jAV_hGDi7ag", type: "youtube", region: "mideast", lang: "ar", color: "#003DA6", category: "news", variantAffinity: ["conflict"] },
  { id: "dw-arabic", label: "DW ARABIC", channelId: "UCQnafuMXJaVkNkXABHCVCew", type: "youtube", region: "mideast", lang: "ar", color: "#0077B6", category: "news" },

  // ═══════════════════════════════════════════════════════════════
  // GERMAN (DE)
  // ═══════════════════════════════════════════════════════════════
  { id: "welt", label: "WELT", channelId: "UCZMsvbAhhRblVGXmEXW8TSA", type: "youtube", region: "eu", lang: "de", color: "#003DA6", category: "news" },
  { id: "ntv-de", label: "NTV", channelId: "UCSeil5V81-mEGB1-VNR7YEA", type: "youtube", region: "eu", lang: "de", color: "#E30613", category: "news" },
  { id: "dw-de", label: "DW DEUTSCH", channelId: "UCMIgOXM2JEQ2Pv2d0_PVfcg", type: "youtube", region: "eu", lang: "de", color: "#0077B6", category: "news" },
  { id: "tagesschau", label: "TAGESSCHAU", channelId: "UC5NOEUbkLheQcaaRldYW5GA", type: "youtube", region: "eu", lang: "de", color: "#004B87", category: "news" },
  { id: "euronews-de", label: "EURONEWS DE", channelId: "UCKUBipysIPNP3iWLBNPAcXA", type: "youtube", region: "eu", lang: "de", color: "#003DA6", category: "news" },

  // ═══════════════════════════════════════════════════════════════
  // SPANISH (ES)
  // ═══════════════════════════════════════════════════════════════
  { id: "france24-es", label: "FRANCE 24 ES", channelId: "UCUdOoVWuWmgo1wByzcsyKDQ", type: "youtube", region: "latam", lang: "es", color: "#00A1E4", category: "news" },
  { id: "dw-es", label: "DW ESPANOL", channelId: "UCT2VKl-tSXjNfSedGNfbfIA", type: "youtube", region: "latam", lang: "es", color: "#0077B6", category: "news" },
  { id: "euronews-es", label: "EURONEWS ES", channelId: "UCyoGb3SMlTlB8CLGVH4c8Rw", type: "youtube", region: "latam", lang: "es", color: "#003DA6", category: "news" },
  { id: "rtve", label: "RTVE 24H", channelId: "UCmoHk6hY1bOb25oRNFj0Ibg", type: "youtube", region: "eu", lang: "es", color: "#E30613", category: "news" },
  { id: "cnn-es", label: "CNN ESPANOL", channelId: "UCkhAfig2sENqfGdpAjkmrCA", type: "youtube", region: "latam", lang: "es", color: "#CC0000", category: "news" },
  { id: "telefe", label: "TELEFE", channelId: "UCWFKwAilAd18C8GCFyyCcqg", type: "youtube", region: "latam", lang: "es", color: "#0055A4", category: "news" },

  // ═══════════════════════════════════════════════════════════════
  // FRENCH (FR)
  // ═══════════════════════════════════════════════════════════════
  { id: "france24-fr", label: "FRANCE 24", channelId: "UCCCPCZNChQdGa9EkABnGJfQ", type: "youtube", region: "eu", lang: "fr", color: "#00A1E4", category: "news" },
  { id: "bfmtv", label: "BFMTV", channelId: "UC-9-kyTW8ZkZNDHQJ6FgpwQ", type: "youtube", region: "eu", lang: "fr", color: "#FF6600", category: "news" },
  { id: "lci", label: "LCI", channelId: "UCewhc0fvja891XkpIPGRMxQ", type: "youtube", region: "eu", lang: "fr", color: "#E30613", category: "news" },
  { id: "franceinfo", label: "FRANCEINFO", channelId: "UCO6K_kkdP-lnSCiO3tPx7WA", type: "youtube", region: "eu", lang: "fr", color: "#003DA6", category: "news" },
  { id: "euronews-fr", label: "EURONEWS FR", channelId: "UCSrZ3UV4jOidv8ppoVuvW9Q", type: "youtube", region: "eu", lang: "fr", color: "#003DA6", category: "news" },
  { id: "tv5monde", label: "TV5MONDE", channelId: "UC9p3RsSH-BfFNyi7EYQ4DWA", type: "youtube", region: "global", lang: "fr", color: "#8B0000", category: "news" },

  // ═══════════════════════════════════════════════════════════════
  // JAPANESE (JA)
  // ═══════════════════════════════════════════════════════════════
  { id: "tbs-ja", label: "TBS NEWS", channelId: "UC6AG81pAkf6Lbi_1VC5NmPA", type: "youtube", region: "asia", lang: "ja", color: "#0033A0", category: "news" },
  { id: "ann-ja", label: "ANN NEWS", channelId: "UCGCZAYq5Xxojl_tSXcVJhiQ", type: "youtube", region: "asia", lang: "ja", color: "#E60012", category: "news" },
  { id: "fnn-ja", label: "FNN PRIME", channelId: "UCtM1M9KDH0YHfT2BCeGSKIA", type: "youtube", region: "asia", lang: "ja", color: "#FF6B00", category: "news" },
  { id: "ntv-ja", label: "\u65E5\u30C6\u30ECNEWS", channelId: "UCuTAXTexrhetbOe3DdtjdAA", type: "youtube", region: "asia", lang: "ja", color: "#003DA6", category: "news" },
  { id: "nhk-ja", label: "NHK", channelId: "UCSPEjw8F2nQDtmUKPFNF7_A", type: "youtube", region: "asia", lang: "ja", color: "#E60012", category: "news" },

  // ═══════════════════════════════════════════════════════════════
  // KOREAN (KO)
  // ═══════════════════════════════════════════════════════════════
  { id: "ytn", label: "YTN", channelId: "UChlgI3UHCOnwUGzWzbJ3H5w", type: "youtube", region: "asia", lang: "ko", color: "#003DA6", category: "news" },
  { id: "kbs-ko", label: "KBS NEWS", channelId: "UCcQTRi69dsVYHN3exePtZ1A", type: "youtube", region: "asia", lang: "ko", color: "#0033A0", category: "news" },
  { id: "mbc-ko", label: "MBC NEWS", channelId: "UCF4Wxdo3inmxP-Y59wXDsFw", type: "youtube", region: "asia", lang: "ko", color: "#003DA6", category: "news" },
  { id: "jtbc-ko", label: "JTBC NEWS", channelId: "UCsU-I-vHLiaMfV_ceaYz5rQ", type: "youtube", region: "asia", lang: "ko", color: "#E30613", category: "news" },
  { id: "sbs-ko", label: "SBS NEWS", channelId: "UCkinYTS9IHqOEwR1Sze2JTw", type: "youtube", region: "asia", lang: "ko", color: "#0055A4", category: "news" },

  // ═══════════════════════════════════════════════════════════════
  // RUSSIAN (RU)
  // ═══════════════════════════════════════════════════════════════
  { id: "euronews-ru", label: "EURONEWS RU", channelId: "UCnfpMGQ9Bkl3JB1tH5FFlnA", type: "youtube", region: "eu", lang: "ru", color: "#003DA6", category: "news" },
  { id: "currenttime", label: "\u041D\u0410\u0421\u0422\u041E\u042F\u0429\u0415\u0415 \u0412\u0420\u0415\u041C\u042F", channelId: "UCdubelOloxR3wzMOG_bMJ4w", type: "youtube", region: "eu", lang: "ru", color: "#1E90FF", category: "news" },

  // ═══════════════════════════════════════════════════════════════
  // CHINESE (ZH)
  // ═══════════════════════════════════════════════════════════════
  { id: "cgtn-zh", label: "CGTN \u4E2D\u6587", channelId: "UCmv5DBKnHNQMBb5vK1FU_tQ", type: "youtube", region: "asia", lang: "zh", color: "#D71920", category: "news" },
  { id: "ntdtv", label: "NTDTV \u65B0\u5510\u4EBA", channelId: "UCtovJRlqAU9gk7xQGCZy2jA", type: "youtube", region: "asia", lang: "zh", color: "#003DA6", category: "news" },
  { id: "dw-zh", label: "DW \u4E2D\u6587", channelId: "UCv-FYOGxkh1QyCu7TXxSVEg", type: "youtube", region: "asia", lang: "zh", color: "#0077B6", category: "news" },
  { id: "phoenix-zh", label: "\u51E4\u51F0\u536B\u89C6", channelId: "UCDtlBYhbSCMgorN2xoC3eBw", type: "youtube", region: "asia", lang: "zh", color: "#FFD700", category: "news" },

  // ═══════════════════════════════════════════════════════════════
  // INDIAN (HI/EN) [NEW]
  // ═══════════════════════════════════════════════════════════════
  { id: "aajtak", label: "AAJ TAK", channelId: "UCt4t-jeY85JegMlZ-E5UWtA", type: "youtube", region: "asia", lang: "hi", country: "IN", color: "#E30613", category: "news" },
  { id: "indiatoday", label: "INDIA TODAY", channelId: "UCYPvAwZP8pZhSMW8qs7cVCw", type: "youtube", region: "asia", lang: "en", country: "IN", color: "#E30613", category: "news" },
  { id: "republictv", label: "REPUBLIC TV", channelId: "UCwLZiRwb3u5H4VXkXmfEdcQ", type: "youtube", region: "asia", lang: "en", country: "IN", color: "#003DA6", category: "news" },
  { id: "timesnow", label: "TIMES NOW", channelId: "UCLJoMf7k1fxlgt_7iZnWXrQ", type: "youtube", region: "asia", lang: "en", country: "IN", color: "#E30613", category: "news" },
  { id: "tv9-bharatvarsh", label: "TV9 BHARATVARSH", channelId: "UCHMm2gFGjFPgmiZrgAzaVHQ", type: "youtube", region: "asia", lang: "hi", country: "IN", color: "#003DA6", category: "news" },

  // ═══════════════════════════════════════════════════════════════
  // AFRICAN (EN) [NEW]
  // ═══════════════════════════════════════════════════════════════
  { id: "africanews", label: "AFRICANEWS", channelId: "UC1_E8NeF5QHY2dtdLRBCCLA", type: "youtube", region: "africa", lang: "en", color: "#003DA6", category: "news" },
  { id: "enca", label: "eNCA", channelId: "UCXpKdDBH-OGmczey8C26Q1w", type: "youtube", region: "africa", lang: "en", country: "ZA", color: "#E30613", category: "news" },
  { id: "arisenews", label: "ARISE NEWS", channelId: "UCk0PL4ZF9XSGzJR2lFCKYFQ", type: "youtube", region: "africa", lang: "en", country: "NG", color: "#003DA6", category: "news" },
  { id: "joynews-gh", label: "JOYNEWS GHANA", channelId: "UCVNmMRp-WKMfeeY0FVPmJQg", type: "youtube", region: "africa", lang: "en", country: "GH", color: "#FFD700", category: "news" },

  // ═══════════════════════════════════════════════════════════════
  // BRAZILIAN / LATIN AMERICA (PT/ES) [NEW]
  // ═══════════════════════════════════════════════════════════════
  { id: "cnn-brasil", label: "CNN BRASIL", channelId: "UCbgcoI3YuIhzjcjaORfv-oA", type: "youtube", region: "latam", lang: "pt", country: "BR", color: "#CC0000", category: "news" },
  { id: "globonews", label: "GLOBONEWS", channelId: "UCPNKQGXslUqP4Ybj_6UDaHQ", type: "youtube", region: "latam", lang: "pt", country: "BR", color: "#003DA6", category: "news" },
  { id: "todonoticias", label: "TODO NOTICIAS", channelId: "UCj6PcyLvpnIaJboiGNb0Eag", type: "youtube", region: "latam", lang: "es", country: "AR", color: "#CC0000", category: "news" },
  { id: "c5n", label: "C5N", channelId: "UCFgk2Q2mVO1BklRQhSv6p0w", type: "youtube", region: "latam", lang: "es", country: "AR", color: "#FF6600", category: "news" },

  // ═══════════════════════════════════════════════════════════════
  // SOUTHEAST ASIA (EN) [NEW]
  // ═══════════════════════════════════════════════════════════════
  { id: "abscbn-news", label: "ABS-CBN NEWS", channelId: "UCaBalcmKzz15AfliEJDzjHQ", type: "youtube", region: "asia", lang: "en", country: "PH", color: "#003DA6", category: "news" },
  { id: "gma-news", label: "GMA NEWS", channelId: "UCslRiB9D6cmr5WqWqmr-Mlg", type: "youtube", region: "asia", lang: "en", country: "PH", color: "#FF6600", category: "news" },

  // ═══════════════════════════════════════════════════════════════
  // SPORTS
  // ═══════════════════════════════════════════════════════════════
  { id: "bein-xtra", label: "beIN SPORTS XTRA", channelId: "UCkWkO8QjIGbxVPn_ymSKqdg", type: "youtube", region: "global", lang: "en", color: "#FFD200", category: "sports", variantAffinity: ["sports"] },
  { id: "nba-tv", label: "NBA", channelId: "UCWJ2lWNubArHWmf3FIHbfcQ", type: "youtube", region: "us", lang: "en", color: "#1D428A", category: "sports", variantAffinity: ["sports"] },
  { id: "ufc", label: "UFC", channelId: "UCvgfXK4nTYKudb0rFR6noLA", type: "youtube", region: "global", lang: "en", color: "#D20A0A", category: "sports", variantAffinity: ["sports"] },
  { id: "wwe", label: "WWE", channelId: "UCJ5v_MCY6GNUBTO8-D3XoAg", type: "youtube", region: "global", lang: "en", color: "#000000", category: "sports", variantAffinity: ["sports"] },
  { id: "sky-sports-news", label: "SKY SPORTS NEWS", channelId: "UCOSia3M_mEs42ygMMfNGEYA", type: "youtube", region: "eu", lang: "en", country: "GB", color: "#E30613", category: "sports", variantAffinity: ["sports"] },
  { id: "espn-youtube", label: "ESPN", channelId: "UCiWLfSweyRNmLpgEHGkPwnw", type: "youtube", region: "us", lang: "en", country: "US", color: "#CC0000", category: "sports", variantAffinity: ["sports"] },
  { id: "tivibu-spor", label: "TIVIBU SPOR", channelId: "UCl8sHGn0MMvAV_nnxiPqxmA", type: "youtube", region: "tr", lang: "tr", country: "TR", color: "#FF6600", category: "sports", variantAffinity: ["sports"] },
  { id: "asspor", label: "A SPOR", channelId: "UCxpRdwFv9rhaOPBaxfbDw0Q", type: "youtube", region: "tr", lang: "tr", country: "TR", color: "#FF0000", category: "sports", variantAffinity: ["sports"] },
  { id: "trt-spor", label: "TRT SPOR", channelId: "UC5HDIjdJmVJ1ZuEOOcJbN0g", type: "youtube", region: "tr", lang: "tr", country: "TR", color: "#E30613", category: "sports", variantAffinity: ["sports"] },
  { id: "bein-tr", label: "beIN SPORTS TR", channelId: "UClPR8mmE0NJ_EqHvyTi0xAQ", type: "youtube", region: "tr", lang: "tr", country: "TR", color: "#FFD200", category: "sports", variantAffinity: ["sports"] },
  { id: "dazn", label: "DAZN", channelId: "UC5Gj6CNmNYdSEWYhv8VqELg", type: "youtube", region: "global", lang: "en", color: "#F5FF00", category: "sports", variantAffinity: ["sports"] },
  { id: "eurosport", label: "EUROSPORT", channelId: "UCuqbB0Ol9SNmwfCLBlkiZ6g", type: "youtube", region: "eu", lang: "en", color: "#003DA6", category: "sports", variantAffinity: ["sports"] },

  // --- Sports NEW ---
  { id: "fiba", label: "FIBA", channelId: "UCS07af6BFHIV7kxD4BFUoIQ", type: "youtube", region: "global", lang: "en", color: "#FF6600", category: "sports", variantAffinity: ["sports"] },
  { id: "olympic-channel", label: "OLYMPIC CHANNEL", channelId: "UCTl3QQTvqHFjurroKxexy2Q", type: "youtube", region: "global", lang: "en", color: "#0055A4", category: "sports", variantAffinity: ["sports"] },
  { id: "copa-america", label: "COPA AMERICA", channelId: "UCqFwzf28Ng_W7LGqeXDIsjw", type: "youtube", region: "latam", lang: "es", color: "#003DA6", category: "sports", variantAffinity: ["sports"] },
];
