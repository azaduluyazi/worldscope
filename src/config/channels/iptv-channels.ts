import type { LiveChannel } from "./types";

/**
 * IPTV/HLS channels — PREMIUM tier only.
 * Organized by region. Every entry has tier: "premium".
 * variantAffinity maps channels to relevant dashboard variants.
 */
export const IPTV_CHANNELS: LiveChannel[] = [
  // ═══════════════════════════════════════════════════════════════
  // ENGLISH — US
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-nbcnews", label: "NBC NEWS NOW", hlsUrl: "https://d1bl6tskrpq9ze.cloudfront.net/hls/master.m3u8", type: "hls", region: "us", lang: "en", country: "US", color: "#E51837", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-bloomberg-us", label: "BLOOMBERG US", hlsUrl: "https://bloomberg.com/media-manifest/streams/us.m3u8", type: "hls", region: "us", lang: "en", country: "US", color: "#2800D7", category: "business", tier: "premium", variantAffinity: ["finance", "commodity"] },
  { id: "hls-newsmax", label: "NEWSMAX", hlsUrl: "https://nmx1ota.akamaized.net/hls/live/2107010/Live_1/index.m3u8", type: "hls", region: "us", lang: "en", country: "US", color: "#003DA6", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-yahoo-finance", label: "YAHOO FINANCE", hlsUrl: "https://d1ewctnvcwvvvu.cloudfront.net/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", color: "#6001D2", category: "business", tier: "premium", variantAffinity: ["finance", "commodity"] },
  { id: "hls-foxweather", label: "FOX WEATHER", hlsUrl: "https://247wlive.foxweather.com/stream/index.m3u8", type: "hls", region: "us", lang: "en", country: "US", color: "#0055A4", category: "news", tier: "premium", variantAffinity: ["weather"] },
  { id: "hls-livenow", label: "LIVENOW FROM FOX", hlsUrl: "https://fox-foxnewsnow-vizio.amagi.tv/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", color: "#003DA6", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-newsy", label: "NEWSY", hlsUrl: "https://547f72e6652371c3.mediapackage.us-east-1.amazonaws.com/out/v1/e3e6e29095844c4ba7d887f01e44a5ef/index.m3u8", type: "hls", region: "us", lang: "en", country: "US", color: "#0055A4", category: "news", tier: "premium", variantAffinity: ["world"] },

  // ═══════════════════════════════════════════════════════════════
  // ENGLISH — GLOBAL
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-reuters", label: "REUTERS TV", hlsUrl: "https://d5bxknkoxytmb.cloudfront.net/playlist/amg00453-reuters-reuters-samsunggb/playlist.m3u8", type: "hls", region: "global", lang: "en", country: "US", color: "#FF6600", category: "news", tier: "premium", variantAffinity: ["world", "finance"] },
  { id: "hls-aje", label: "AL JAZEERA EN", hlsUrl: "https://live-hls-web-aje-fa.thehlive.com/AJE/index.m3u8", type: "hls", region: "global", lang: "en", country: "QA", color: "#D4AA00", category: "news", tier: "premium", variantAffinity: ["world", "conflict"] },
  { id: "hls-aje-hq", label: "AJ ENGLISH HQ", hlsUrl: "https://live-hls-apps-aje-fa.getaj.net/AJE/index.m3u8", type: "hls", region: "global", lang: "en", country: "QA", color: "#D4AA00", category: "news", tier: "premium", variantAffinity: ["world", "conflict"] },
  { id: "hls-france24en", label: "FRANCE 24 EN", hlsUrl: "https://live.france24.com/hls/live/2037218/F24_EN_HI_HLS/master_5000.m3u8", type: "hls", region: "global", lang: "en", country: "FR", color: "#00A1E4", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-dwen", label: "DW ENGLISH", hlsUrl: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/master.m3u8", type: "hls", region: "global", lang: "en", country: "DE", color: "#0077B6", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-abcnews-au", label: "ABC NEWS AU", hlsUrl: "https://abc-news-dmd-streams-1.akamaized.net/out/v1/701126012d044971b3fa89406a440133/index.m3u8", type: "hls", region: "global", lang: "en", country: "AU", color: "#00843D", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-ausbiz", label: "AUSBIZ TV", hlsUrl: "https://d9quh89lh7dtw.cloudfront.net/public-output/index.m3u8", type: "hls", region: "global", lang: "en", country: "AU", color: "#0055A4", category: "business", tier: "premium", variantAffinity: ["finance"] },
  { id: "hls-skynews-au", label: "SKY NEWS AU", hlsUrl: "https://skynewsau-live.akamaized.net/hls/live/2002689/skynewsau-extra1/master.m3u8", type: "hls", region: "global", lang: "en", country: "AU", color: "#E30613", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-cpac", label: "CPAC", hlsUrl: "https://d7z3qjdsxbwoq.cloudfront.net/groupa/live/f9809cea-1e07-47cd-a94d-2ddd3e1351db/live.isml/.m3u8", type: "hls", region: "global", lang: "en", country: "CA", color: "#E30613", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-citynews-to", label: "CITYNEWS TORONTO", hlsUrl: "https://citynewsregional.akamaized.net/hls/live/1024052/Regional_Live_7/master.m3u8", type: "hls", region: "global", lang: "en", country: "CA", color: "#FF6600", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-ici-rdi", label: "ICI RDI", hlsUrl: "https://rcavlive.akamaized.net/hls/live/704025/xcanrdi/master.m3u8", type: "hls", region: "global", lang: "fr", country: "CA", color: "#003DA6", category: "news", tier: "premium", variantAffinity: ["world"] },

  // ═══════════════════════════════════════════════════════════════
  // ENGLISH — UK
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-gbnews", label: "GB NEWS", hlsUrl: "https://live-gbnews.simplestreamcdn.com/s3/gbnews/index.m3u8", type: "hls", region: "eu", lang: "en", country: "GB", color: "#003DA6", category: "news", tier: "premium", variantAffinity: ["world"] },

  // ═══════════════════════════════════════════════════════════════
  // ENGLISH — INDIA
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-ndtv", label: "NDTV 24x7", hlsUrl: "https://ndtv24x7elemarchana.akamaized.net/hls/live/2003678/ndtv24x7/master.m3u8", type: "hls", region: "asia", lang: "en", country: "IN", color: "#E30613", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-wion", label: "WION HLS", hlsUrl: "https://d7x3qjdsxbwoq.cloudfront.net/index_7.m3u8", type: "hls", region: "asia", lang: "en", country: "IN", color: "#FF6B00", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-ndtvprofit", label: "NDTV PROFIT", hlsUrl: "https://ndtvprofit.akamaized.net/hls/live/2107404/ndtvprofit/master_1.m3u8", type: "hls", region: "asia", lang: "en", country: "IN", color: "#00843D", category: "business", tier: "premium", variantAffinity: ["finance"] },

  // ═══════════════════════════════════════════════════════════════
  // TURKISH — TR
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-trthaber", label: "TRT HABER", hlsUrl: "https://tv-trthaber.medya.trt.com.tr/master.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#E30613", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-ntv", label: "NTV", hlsUrl: "https://dogus-live.daioncdn.net/ntv/ntv.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#003DA6", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-haberturk", label: "HABERT\u00dcRK", hlsUrl: "https://ciner-live.daioncdn.net/haberturktv/haberturktv.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#0055A4", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-bloomberght", label: "BLOOMBERG HT", hlsUrl: "https://ciner-live.daioncdn.net/bloomberght/bloomberght.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#2800D7", category: "business", tier: "premium", variantAffinity: ["finance", "commodity"] },
  { id: "hls-haberglobal", label: "HABER GLOBAL", hlsUrl: "https://tv.ensonhaber.com/haberglobal/haberglobal.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#1E90FF", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-tv100", label: "TV100", hlsUrl: "https://tv100-live.daioncdn.net/tv100/tv100.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#E30613", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-tgrt", label: "TGRT HABER", hlsUrl: "https://canli.tgrthaber.com/tgrt.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#8B0000", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-trtbelgesel", label: "TRT BELGESEL", hlsUrl: "https://tv-trtbelgesel.medya.trt.com.tr/master.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#004B87", category: "documentary", tier: "premium" },
  { id: "hls-halktv", label: "HALK TV", hlsUrl: "https://halktv-live.daioncdn.net/halktv/halktv.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#E30613", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-tele1", label: "TELE 1", hlsUrl: "https://tele1-live.ercdn.net/tele1/tele1.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#FF6600", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-kanald", label: "KANAL D", hlsUrl: "https://demiroren.daioncdn.net/kanald/kanald.m3u8?app=kanald_web&ce=3", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#003DA6", category: "news", tier: "premium" },
  { id: "hls-atv", label: "ATV", hlsUrl: "https://trkvz-live.ercdn.net/tv2/tv2.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#FF0000", category: "news", tier: "premium" },
  { id: "hls-teve2", label: "TEVE2", hlsUrl: "https://demiroren-live.daioncdn.net/teve2/teve2.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#0055A4", category: "news", tier: "premium" },
  { id: "hls-trt1", label: "TRT 1", hlsUrl: "https://tv-trt1.medya.trt.com.tr/master.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#E30613", category: "news", tier: "premium" },
  { id: "hls-tbmm", label: "TBMM TV", hlsUrl: "https://meclistv-live.ercdn.net/meclistv/meclistv.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", color: "#004B87", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // ARABIC — MIDDLE EAST
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-aja", label: "\u0627\u0644\u062C\u0632\u064A\u0631\u0629", hlsUrl: "https://live-hls-web-aja.getaj.net/AJA/index.m3u8", type: "hls", region: "mideast", lang: "ar", country: "QA", color: "#D4AA00", category: "news", tier: "premium", variantAffinity: ["conflict", "world"] },
  { id: "hls-aja-hq", label: "\u0627\u0644\u062C\u0632\u064A\u0631\u0629 HQ", hlsUrl: "https://live-hls-apps-aja-fa.getaj.net/AJA/index.m3u8", type: "hls", region: "mideast", lang: "ar", country: "QA", color: "#D4AA00", category: "news", tier: "premium", variantAffinity: ["conflict", "world"] },
  { id: "hls-ajm", label: "AJ MUBASHER", hlsUrl: "https://live-hls-apps-ajm-fa.getaj.net/AJM/index.m3u8", type: "hls", region: "mideast", lang: "ar", country: "QA", color: "#D4AA00", category: "news", tier: "premium", variantAffinity: ["conflict"] },
  { id: "hls-alarabiya", label: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", hlsUrl: "https://live.alarabiya.net/alarabiapublish/alarabiya.smil/playlist.m3u8", type: "hls", region: "mideast", lang: "ar", country: "AE", color: "#B8860B", category: "news", tier: "premium", variantAffinity: ["conflict", "world"] },
  { id: "hls-alarabiya-en", label: "AL ARABIYA EN", hlsUrl: "https://live.alarabiya.net/alarabiapublish/english/playlist_dvr.m3u8", type: "hls", region: "mideast", lang: "en", country: "SA", color: "#B8860B", category: "news", tier: "premium", variantAffinity: ["conflict", "world"] },
  { id: "hls-alhadath", label: "AL HADATH", hlsUrl: "https://shd-gcp-live.edgenextcdn.net/live/bitmovin-hadath/2ff87ec4c2f3ede35295a20637d9f8fd/index.m3u8", type: "hls", region: "mideast", lang: "ar", country: "SA", color: "#B8860B", category: "news", tier: "premium", variantAffinity: ["conflict"] },
  { id: "hls-skynews-ar", label: "\u0633\u0643\u0627\u064A \u0646\u064A\u0648\u0632 \u0639\u0631\u0628\u064A\u0629", hlsUrl: "https://live-stream.skynewsarabia.com/c-horizontal-channel/horizontal-stream/index.m3u8", type: "hls", region: "mideast", lang: "ar", country: "AE", color: "#0072BC", category: "news", tier: "premium", variantAffinity: ["conflict", "world"] },
  { id: "hls-asharq", label: "\u0627\u0644\u0634\u0631\u0642", hlsUrl: "https://live-news.asharq.com/asharq.m3u8", type: "hls", region: "mideast", lang: "ar", country: "SA", color: "#003DA6", category: "news", tier: "premium", variantAffinity: ["conflict", "world"] },
  { id: "hls-ekhbariya", label: "\u0627\u0644\u0625\u062E\u0628\u0627\u0631\u064A\u0629", hlsUrl: "https://shd-gcp-live.edgenextcdn.net/live/bitmovin-al-ekhbaria/297b3ef1cd0633ad9cfba7473a686a06/index.m3u8", type: "hls", region: "mideast", lang: "ar", country: "SA", color: "#00843D", category: "news", tier: "premium", variantAffinity: ["conflict"] },
  { id: "hls-cnbcarabiya", label: "CNBC ARABIYA", hlsUrl: "https://cnbc-live.akamaized.net/cnbc/master.m3u8", type: "hls", region: "mideast", lang: "ar", country: "AE", color: "#005594", category: "business", tier: "premium", variantAffinity: ["finance"] },

  // ═══════════════════════════════════════════════════════════════
  // ARABIC — EGYPT
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-alghadtv", label: "AL GHAD TV", hlsUrl: "https://eazyvwqssi.erbvr.com/alghadtv/alghadtv.m3u8", type: "hls", region: "mideast", lang: "ar", country: "EG", color: "#E30613", category: "news", tier: "premium", variantAffinity: ["conflict"] },

  // ═══════════════════════════════════════════════════════════════
  // ISRAEL
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-i24news-en", label: "I24 NEWS EN", hlsUrl: "https://bcovlive-a.akamaihd.net/ecf224f43f3b43e69471a7b626481af0/eu-central-1/5377161796001/playlist.m3u8", type: "hls", region: "mideast", lang: "en", country: "IL", color: "#0055A4", category: "news", tier: "premium", variantAffinity: ["conflict"] },
  { id: "hls-i24news-he", label: "I24 NEWS HE", hlsUrl: "https://bcovlive-a.akamaihd.net/d89ede8094c741b7924120b27764153c/eu-central-1/5377161796001/playlist.m3u8", type: "hls", region: "mideast", lang: "he", country: "IL", color: "#003DA6", category: "news", tier: "premium", variantAffinity: ["conflict"] },
  { id: "hls-i24news-ar", label: "I24 NEWS AR", hlsUrl: "https://bcovlive-a.akamaihd.net/95116e8d79524d87bf3ac20ba04241e3/eu-central-1/5377161796001/playlist.m3u8", type: "hls", region: "mideast", lang: "ar", country: "IL", color: "#D4AA00", category: "news", tier: "premium", variantAffinity: ["conflict"] },
  { id: "hls-i24news-fr", label: "I24 NEWS FR", hlsUrl: "https://bcovlive-a.akamaihd.net/41814196d97e433fb401c5e632d985e9/eu-central-1/5377161796001/playlist.m3u8", type: "hls", region: "mideast", lang: "fr", country: "IL", color: "#00A1E4", category: "news", tier: "premium", variantAffinity: ["conflict"] },
  { id: "hls-knesset", label: "KNESSET TV", hlsUrl: "https://contact.gostreaming.tv/Knesset/myStream/playlist.m3u8", type: "hls", region: "mideast", lang: "he", country: "IL", color: "#004B87", category: "news", tier: "premium", variantAffinity: ["conflict"] },

  // ═══════════════════════════════════════════════════════════════
  // IRAN
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-presstv", label: "PRESS TV", hlsUrl: "https://live.presstv.ir/hls/presstv.m3u8", type: "hls", region: "mideast", lang: "en", country: "IR", color: "#00843D", category: "news", tier: "premium", variantAffinity: ["conflict"] },
  { id: "hls-presstv-fr", label: "PRESS TV FR", hlsUrl: "https://live4.presstv.ir/live/smil:presstvfr.smil/playlist.m3u8", type: "hls", region: "mideast", lang: "fr", country: "IR", color: "#003DA6", category: "news", tier: "premium", variantAffinity: ["conflict"] },
  { id: "hls-alalam", label: "AL ALAM", hlsUrl: "https://live2.alalam.ir/alalam.m3u8", type: "hls", region: "mideast", lang: "ar", country: "IR", color: "#E30613", category: "news", tier: "premium", variantAffinity: ["conflict"] },
  { id: "hls-iranintl", label: "IRAN INTL", hlsUrl: "https://live.livetvstream.co.uk/LS-63503-4/index.m3u8", type: "hls", region: "mideast", lang: "fa", country: "GB", color: "#00843D", category: "news", tier: "premium", variantAffinity: ["conflict"] },

  // ═══════════════════════════════════════════════════════════════
  // IRAQ / KURDISTAN
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-aliraqia", label: "AL IRAQIA", hlsUrl: "https://cdn.catiacast.video/abr/8d2ffb0aba244e8d9101a9488a7daa05/playlist.m3u8", type: "hls", region: "mideast", lang: "ar", country: "IQ", color: "#003DA6", category: "news", tier: "premium", variantAffinity: ["conflict"] },
  { id: "hls-aliraqia-news", label: "AL IRAQIA NEWS", hlsUrl: "https://cdn.catiacast.video/abr/78054972db7708422595bc96c6e024ac/playlist.m3u8", type: "hls", region: "mideast", lang: "ar", country: "IQ", color: "#E30613", category: "news", tier: "premium", variantAffinity: ["conflict"] },
  { id: "hls-sharqiya-news", label: "AL-SHARQIYA NEWS", hlsUrl: "https://5d94523502c2d.streamlock.net/alsharqiyalive/mystream/playlist.m3u8", type: "hls", region: "mideast", lang: "ar", country: "IQ", color: "#0055A4", category: "news", tier: "premium", variantAffinity: ["conflict"] },
  { id: "hls-inews-iq", label: "INEWS TV", hlsUrl: "https://live.i-news.tv/hls/stream.m3u8", type: "hls", region: "mideast", lang: "ar", country: "IQ", color: "#FF6600", category: "news", tier: "premium", variantAffinity: ["conflict"] },
  { id: "hls-kurdsat-news", label: "KURDSAT NEWS", hlsUrl: "https://hlspackager.akamaized.net/live/DB/KURDSAT_NEWS/HLS/KURDSAT_NEWS.m3u8", type: "hls", region: "mideast", lang: "ku", country: "IQ", color: "#00843D", category: "news", tier: "premium", variantAffinity: ["conflict"] },
  { id: "hls-kurdistan24", label: "KURDISTAN 24", hlsUrl: "https://d1x82nydcxndze.cloudfront.net/live/index.m3u8", type: "hls", region: "mideast", lang: "ku", country: "IQ", color: "#FFD700", category: "news", tier: "premium", variantAffinity: ["conflict"] },

  // ═══════════════════════════════════════════════════════════════
  // GERMAN
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-tagesschau24", label: "TAGESSCHAU 24", hlsUrl: "https://tagesschau.akamaized.net/hls/live/2020115/tagesschau/tagesschau_1/master.m3u8", type: "hls", region: "eu", lang: "de", country: "DE", color: "#004B87", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-daserste", label: "DAS ERSTE", hlsUrl: "https://daserste-live.ard-mcdn.de/daserste/live/hls/int/master.m3u8", type: "hls", region: "eu", lang: "de", country: "DE", color: "#003DA6", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-dwar", label: "DW ARABIC", hlsUrl: "https://dwamdstream103.akamaized.net/hls/live/2015526/dwstream103/master.m3u8", type: "hls", region: "mideast", lang: "ar", country: "DE", color: "#0077B6", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-dwes", label: "DW ESPA\u00d1OL", hlsUrl: "https://dwamdstream104.akamaized.net/hls/live/2015530/dwstream104/master.m3u8", type: "hls", region: "latam", lang: "es", country: "DE", color: "#0077B6", category: "news", tier: "premium", variantAffinity: ["world"] },

  // ═══════════════════════════════════════════════════════════════
  // FRENCH
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-bfmtv", label: "BFM TV", hlsUrl: "https://live-cdn-stream-euw1.bfmtv.bct.nextradiotv.com/master.m3u8", type: "hls", region: "eu", lang: "fr", country: "FR", color: "#FF6600", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-bfmbiz", label: "BFM BUSINESS", hlsUrl: "https://live-cdn-stream-euw1.bfmb.bct.nextradiotv.com/master.m3u8", type: "hls", region: "eu", lang: "fr", country: "FR", color: "#003DA6", category: "business", tier: "premium", variantAffinity: ["finance"] },
  { id: "hls-france24fr", label: "FRANCE 24 FR", hlsUrl: "https://live.france24.com/hls/live/2037179/F24_FR_HI_HLS/master_5000.m3u8", type: "hls", region: "eu", lang: "fr", country: "FR", color: "#00A1E4", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-france24ar", label: "FRANCE 24 AR", hlsUrl: "https://live.france24.com/hls/live/2037222/F24_AR_HI_HLS/master_5000.m3u8", type: "hls", region: "mideast", lang: "ar", country: "FR", color: "#00A1E4", category: "news", tier: "premium", variantAffinity: ["world", "conflict"] },
  { id: "hls-france24es", label: "FRANCE 24 ES", hlsUrl: "https://live.france24.com/hls/live/2037220/F24_ES_HI_HLS/master_5000.m3u8", type: "hls", region: "latam", lang: "es", country: "FR", color: "#00A1E4", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-tv5monde", label: "TV5MONDE INFO", hlsUrl: "https://ott.tv5monde.com/Content/HLS/Live/channel(info)/variant.m3u8", type: "hls", region: "global", lang: "fr", country: "FR", color: "#8B0000", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-africa24", label: "AFRICA 24", hlsUrl: "https://africa24.vedge.infomaniak.com/livecast/ik:africa24/manifest.m3u8", type: "hls", region: "africa", lang: "fr", country: "FR", color: "#FFD700", category: "news", tier: "premium", variantAffinity: ["world"] },

  // ═══════════════════════════════════════════════════════════════
  // SPANISH
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-canal24h", label: "CANAL 24H", hlsUrl: "https://ztnr.rtve.es/ztnr/1694255.m3u8", type: "hls", region: "eu", lang: "es", country: "ES", color: "#E30613", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-3catinfo", label: "3CAT INFO", hlsUrl: "https://directes-tv-int.3catdirectes.cat/live-origin/canal324-hls/master.m3u8", type: "hls", region: "eu", lang: "ca", country: "ES", color: "#003DA6", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // ITALIAN
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-rainews24", label: "RAI NEWS 24", hlsUrl: "https://rainews1-live.akamaized.net/hls/live/598326/rainews1/rainews1/playlist.m3u8", type: "hls", region: "eu", lang: "it", country: "IT", color: "#003DA6", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-tgcom24", label: "TGCOM 24", hlsUrl: "https://live2-mediaset-it.akamaized.net/Content/hls_h0_clr_vos/live/channel(kf)/index.m3u8", type: "hls", region: "eu", lang: "it", country: "IT", color: "#E30613", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-lacnews24", label: "LAC NEWS 24", hlsUrl: "https://f5842579ff984c1c98d63b8d789673eb.msvdn.net/live/S27391994/HVvPMzy/playlist.m3u8", type: "hls", region: "eu", lang: "it", country: "IT", color: "#FF6600", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // POLISH
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-tvpinfo", label: "TVP INFO", hlsUrl: "https://lowa8026-cmyk.github.io/tvpvod/399699.m3u8", type: "hls", region: "eu", lang: "pl", country: "PL", color: "#E30613", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-polsatnews", label: "POLSAT NEWS", hlsUrl: "https://cdn-s-lb2.pluscdn.pl/lv/1517830/349/hls/f03a76f3/masterlist.m3u8", type: "hls", region: "eu", lang: "pl", country: "PL", color: "#003DA6", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-tvbiznesowa", label: "TV BIZNESOWA", hlsUrl: "https://s-pl-01.mediatool.tv/playout/tbpl-abr/index.m3u8", type: "hls", region: "eu", lang: "pl", country: "PL", color: "#0055A4", category: "business", tier: "premium", variantAffinity: ["finance"] },
  { id: "hls-echo24", label: "ECHO24", hlsUrl: "https://echo24new.pl/LiveAppStreamECHO24/streams/GL0VksiIgQUS1672825288490.m3u8", type: "hls", region: "eu", lang: "pl", country: "PL", color: "#FF6600", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // UKRAINIAN
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-24kanal", label: "24 \u041A\u0410\u041D\u0410\u041B", hlsUrl: "https://streamvideol1.luxnet.ua/news24/smil:news24.stream.smil/playlist.m3u8", type: "hls", region: "eu", lang: "uk", country: "UA", color: "#FFD700", category: "news", tier: "premium", variantAffinity: ["conflict", "world"] },
  { id: "hls-espreso", label: "ESPRESO TV", hlsUrl: "https://liveovh009.cda.pl/2mwlMj_cpciQwY9XKkuwooIeujskIie828C5uElA/1760154894/24372638/enc024/espresotvraw/espresotvraw.m3u8", type: "hls", region: "eu", lang: "uk", country: "UA", color: "#003DA6", category: "news", tier: "premium", variantAffinity: ["conflict"] },
  { id: "hls-freedom-ua", label: "FREEDOM", hlsUrl: "https://freedom.cdn-01.cosmonova.net.ua/mobile-app/main/freedom/master.m3u8", type: "hls", region: "eu", lang: "uk", country: "UA", color: "#0055A4", category: "news", tier: "premium", variantAffinity: ["conflict"] },

  // ═══════════════════════════════════════════════════════════════
  // DUTCH
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-tweedekamer", label: "TWEEDE KAMER", hlsUrl: "https://livestreaming.b67buv2.tweedekamer.nl/live/plenairezaal/index.m3u8?hd=1&keyframes=1&subtitles=live", type: "hls", region: "eu", lang: "nl", country: "NL", color: "#FF6600", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // SCANDINAVIAN
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-expressen", label: "EXPRESSEN TV", hlsUrl: "https://cdn0-03837-liveedge0.dna.ip-only.net/03837-liveedge0/smil:03837-tx2/playlist.m3u8", type: "hls", region: "eu", lang: "sv", country: "SE", color: "#E30613", category: "news", tier: "premium" },
  { id: "hls-nrk1", label: "NRK 1", hlsUrl: "https://nrk-live-no.akamaized.net/nrk1/muxed.m3u8", type: "hls", region: "eu", lang: "no", country: "NO", color: "#E30613", category: "news", tier: "premium" },
  { id: "hls-nrk2", label: "NRK 2", hlsUrl: "https://nrk-live-no.akamaized.net/nrk2/muxed.m3u8", type: "hls", region: "eu", lang: "no", country: "NO", color: "#003DA6", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // GREEK
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-vouli", label: "VOULI TV", hlsUrl: "https://streamer-cache.grnet.gr/parliament/parltv.sdp/master.m3u8", type: "hls", region: "eu", lang: "el", country: "GR", color: "#0055A4", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // ROMANIAN
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-digi24", label: "DIGI 24", hlsUrl: "https://edge-ar.rcs-rds.ro/digi24ar/index.m3u8", type: "hls", region: "eu", lang: "ro", country: "RO", color: "#003DA6", category: "news", tier: "premium" },
  { id: "hls-alephnews", label: "ALEPH NEWS", hlsUrl: "https://stream-aleph.m.ro/Aleph/ngrp:Alephnewsmain.stream_all/playlist.m3u8", type: "hls", region: "eu", lang: "ro", country: "RO", color: "#0055A4", category: "news", tier: "premium" },
  { id: "hls-alephbiz", label: "ALEPH BUSINESS", hlsUrl: "https://streamw.m.ro/Aleph/ngrp:Alephbiz.stream_all/playlist.m3u8", type: "hls", region: "eu", lang: "ro", country: "RO", color: "#2800D7", category: "business", tier: "premium", variantAffinity: ["finance"] },
  { id: "hls-romaniatv", label: "ROMANIA TV", hlsUrl: "https://livestream.romaniatv.net/clients/romaniatv/playlist.m3u8", type: "hls", region: "eu", lang: "ro", country: "RO", color: "#E30613", category: "news", tier: "premium" },
  { id: "hls-profitnews", label: "PROFIT NEWS", hlsUrl: "https://stream1.profit.ro:1945/profit/livestream/playlist.m3u8", type: "hls", region: "eu", lang: "ro", country: "RO", color: "#00843D", category: "business", tier: "premium", variantAffinity: ["finance"] },

  // ═══════════════════════════════════════════════════════════════
  // PORTUGUESE — PORTUGAL
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-rtpnoticias", label: "RTP NOT\u00cdCIAS", hlsUrl: "https://streaming-live.rtp.pt/livetvhlsDVR/rtpnHDdvr.smil/playlist.m3u8", type: "hls", region: "eu", lang: "pt", country: "PT", color: "#003DA6", category: "news", tier: "premium" },
  { id: "hls-sicnoticias", label: "SIC NOT\u00cdCIAS", hlsUrl: "https://d277k9d1h9dro4.cloudfront.net/out/v1/293e7c3464824cbd8818ab8e49dc5fe9/index.m3u8", type: "hls", region: "eu", lang: "pt", country: "PT", color: "#E30613", category: "news", tier: "premium" },
  { id: "hls-artv", label: "ARTV PARLAMENTO", hlsUrl: "https://playout172.livextend.cloud/liveiframe/_definst_/liveartvabr/playlist.m3u8", type: "hls", region: "eu", lang: "pt", country: "PT", color: "#0055A4", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // RUSSIAN
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-rbktv", label: "\u0420\u0411\u041A-\u0422\u0412", hlsUrl: "http://online-video.rbc.ru/online2/rbctv.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", color: "#E30613", category: "business", tier: "premium", variantAffinity: ["finance"] },
  { id: "hls-mir24", label: "\u041C\u0418\u0420 24", hlsUrl: "http://hls.mirtv.cdnvideo.ru/mirtv-parampublish/mir24_2500/playlist.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", color: "#003DA6", category: "news", tier: "premium" },
  { id: "hls-izvestia", label: "\u0418\u0417\u0412\u0415\u0421\u0422\u0418\u042F", hlsUrl: "http://igi-hls.cdnvideo.ru/igi/igi_tcode/playlist.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", color: "#003DA6", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // JAPAN / KOREA
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-nhkworld", label: "NHK WORLD", hlsUrl: "https://masterpl.hls.nhkworld.jp/hls/w/live/smarttv.m3u8", type: "hls", region: "asia", lang: "ja", country: "JP", color: "#E60012", category: "news", tier: "premium", variantAffinity: ["world", "tech"] },
  { id: "hls-arirang", label: "ARIRANG TV", hlsUrl: "http://amdlive-ch01.ctnd.com.edgesuite.net/arirang_1ch/smil:arirang_1ch.smil/playlist.m3u8", type: "hls", region: "asia", lang: "ko", country: "KR", color: "#0033A0", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-ktv", label: "KOREA TV", hlsUrl: "https://hlive.ktv.go.kr/live/klive_h.stream/playlist.m3u8", type: "hls", region: "asia", lang: "ko", country: "KR", color: "#003DA6", category: "news", tier: "premium" },
  { id: "hls-ytn", label: "YTN", hlsUrl: "http://202.60.106.14:8080/214/playlist.m3u8", type: "hls", region: "asia", lang: "ko", country: "KR", color: "#003DA6", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // CHINESE
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-cgtn-en", label: "CGTN EN", hlsUrl: "https://english-livebkali.cgtn.com/live/encgtn.m3u8", type: "hls", region: "asia", lang: "zh", country: "CN", color: "#D71920", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-cgtn-doc", label: "CGTN DOC", hlsUrl: "https://amg00405-rakutentv-cgtndocumentary-rakuten-0ql8j.amagi.tv/master.m3u8", type: "hls", region: "asia", lang: "zh", country: "CN", color: "#D71920", category: "documentary", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // INDIA — HINDI
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-aajtak", label: "AAJ TAK", hlsUrl: "https://feeds.intoday.in/aajtak/api/aajtakhd/master.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", color: "#E30613", category: "news", tier: "premium" },
  { id: "hls-abpnews", label: "ABP NEWS", hlsUrl: "https://d2l4ar6y3mrs4k.cloudfront.net/live-streaming/abpnews-livetv/master.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", color: "#FF6600", category: "news", tier: "premium" },
  { id: "hls-indiatv", label: "INDIA TV", hlsUrl: "https://pl-indiatvnews.akamaized.net/out/v1/db79179b608641ceaa5a4d0dd0dca8da/index.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", color: "#003DA6", category: "news", tier: "premium" },
  { id: "hls-news18", label: "NEWS18 INDIA", hlsUrl: "https://n18syndication.akamaized.net/bpk-tv/News18_India_NW18_MOB/output01/master.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", color: "#0055A4", category: "news", tier: "premium" },
  { id: "hls-cnbcawaaz", label: "CNBC AWAAZ", hlsUrl: "https://n18syndication.akamaized.net/bpk-tv/CNBC_Awaaz_NW18_MOB/output01/master.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", color: "#005594", category: "business", tier: "premium", variantAffinity: ["finance"] },
  { id: "hls-zeenews", label: "ZEE NEWS", hlsUrl: "https://dknttpxmr0dwf.cloudfront.net/index_57.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", color: "#E30613", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // PAKISTAN
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-dunyanews", label: "DUNYA NEWS", hlsUrl: "https://imob.dunyanews.tv/livehd/ngrp:dunyalivehd_2_all/playlist.m3u8", type: "hls", region: "asia", lang: "ur", country: "PK", color: "#00843D", category: "news", tier: "premium", variantAffinity: ["conflict"] },
  { id: "hls-neonews", label: "NEO NEWS", hlsUrl: "https://vodzong.mjunoon.tv:8087/streamtest/Neo-110/playlist.m3u8", type: "hls", region: "asia", lang: "ur", country: "PK", color: "#003DA6", category: "news", tier: "premium" },
  { id: "hls-newsone-pk", label: "NEWS ONE", hlsUrl: "https://vodzong.mjunoon.tv:8087/streamtest/NEWS1-128/playlist.m3u8", type: "hls", region: "asia", lang: "ur", country: "PK", color: "#E30613", category: "news", tier: "premium" },
  { id: "hls-samaa", label: "SAMAA TV", hlsUrl: "https://vodzong.mjunoon.tv:8087/streamtest/SAMAA-173/playlist.m3u8", type: "hls", region: "asia", lang: "ur", country: "PK", color: "#FF6600", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // PHILIPPINES
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-ptv-ph", label: "PTV", hlsUrl: "https://ythls.armelin.one/channel/UCJCUbMaY593_4SN1QPG7NFQ.m3u8", type: "hls", region: "asia", lang: "en", country: "PH", color: "#003DA6", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // MALAYSIA
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-beritartm", label: "BERITA RTM", hlsUrl: "https://d25tgymtnqzu8s.cloudfront.net/smil:berita/playlist.m3u8?id=5", type: "hls", region: "asia", lang: "ms", country: "MY", color: "#003DA6", category: "news", tier: "premium" },
  { id: "hls-parlimen-rakyat", label: "PARLIMEN RAKYAT", hlsUrl: "https://d25tgymtnqzu8s.cloudfront.net/smil:rakyat/playlist.m3u8?id=7", type: "hls", region: "asia", lang: "ms", country: "MY", color: "#FFD700", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // INDONESIA
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-cnbc-id", label: "CNBC INDONESIA", hlsUrl: "https://live.cnbcindonesia.com/livecnbc/smil:cnbctv.smil/master.m3u8", type: "hls", region: "asia", lang: "id", country: "ID", color: "#005594", category: "business", tier: "premium", variantAffinity: ["finance"] },
  { id: "hls-metrotv", label: "METRO TV", hlsUrl: "https://edge.medcom.id/live-edge/smil:metro.smil/playlist.m3u8", type: "hls", region: "asia", lang: "id", country: "ID", color: "#003DA6", category: "news", tier: "premium" },
  { id: "hls-tvri", label: "TVRI", hlsUrl: "https://ott-balancer.tvri.go.id/live/eds/Nasional/hls/Nasional.m3u8", type: "hls", region: "asia", lang: "id", country: "ID", color: "#E30613", category: "news", tier: "premium" },
  { id: "hls-tvriworld", label: "TVRI WORLD", hlsUrl: "https://ott-balancer.tvri.go.id/live/eds/TVRIWorld/hls/TVRIWorld.m3u8", type: "hls", region: "asia", lang: "id", country: "ID", color: "#0055A4", category: "news", tier: "premium" },
  { id: "hls-parlemen-id", label: "TVR PARLEMEN", hlsUrl: "https://ssv1.dpr.go.id/golive/livestream/playlist.m3u8", type: "hls", region: "asia", lang: "id", country: "ID", color: "#FFD700", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // THAILAND
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-thaipbs", label: "THAI PBS", hlsUrl: "https://thaipbs-live.cdn.byteark.com/live/playlist.m3u8", type: "hls", region: "asia", lang: "th", country: "TH", color: "#003DA6", category: "news", tier: "premium" },
  { id: "hls-topnews-th", label: "TOP NEWS", hlsUrl: "https://live.topnews.co.th/hls/topnews_a_720.m3u8", type: "hls", region: "asia", lang: "th", country: "TH", color: "#E30613", category: "news", tier: "premium" },
  { id: "hls-parliament-th", label: "PARLIAMENT TV", hlsUrl: "https://tv-live.tpchannel.org/live/tv.m3u8", type: "hls", region: "asia", lang: "th", country: "TH", color: "#FFD700", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // VIETNAM
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-vtv1", label: "VTV1", hlsUrl: "https://liveh12.vtvprime.vn/hls/VTV1_HD/index.m3u8", type: "hls", region: "asia", lang: "vi", country: "VN", color: "#E30613", category: "news", tier: "premium" },
  { id: "hls-qpvn", label: "QPVN", hlsUrl: "https://qpvn.vn/live/qpvn/master.m3u8", type: "hls", region: "asia", lang: "vi", country: "VN", color: "#003DA6", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // AFRICA — NIGERIA
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-channelstv", label: "CHANNELS TV", hlsUrl: "https://cs2.push2stream.com/CHANNELSTV-DVR/playlist.m3u8", type: "hls", region: "africa", lang: "en", country: "NG", color: "#E30613", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-ln247", label: "LN247", hlsUrl: "https://go5lmb6oyawb-hls-live.5centscdn.com/station/3dfd3752af3d7aec5c53992c2da3a316.sdp/playlist.m3u8", type: "hls", region: "africa", lang: "en", country: "NG", color: "#003DA6", category: "news", tier: "premium" },
  { id: "hls-newscentral", label: "NEWS CENTRAL", hlsUrl: "https://wf.newscentral.ng:8443/hls/stream.m3u8", type: "hls", region: "africa", lang: "en", country: "NG", color: "#0055A4", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // AFRICA — SOUTH AFRICA
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-sabcnews", label: "SABC NEWS", hlsUrl: "https://sabconetanw.cdn.mangomolo.com/news/smil:news.stream.smil/master.m3u8", type: "hls", region: "africa", lang: "en", country: "ZA", color: "#003DA6", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-wildearth", label: "WILDEARTH", hlsUrl: "https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01290-wildearth-oando/playlist.m3u8", type: "hls", region: "africa", lang: "en", country: "ZA", color: "#00843D", category: "documentary", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // LATIN AMERICA — BRAZIL
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-recordnews", label: "RECORD NEWS", hlsUrl: "https://rnw-rn.otteravision.com/rnw/rn/rnw_rn.m3u8", type: "hls", region: "latam", lang: "pt", country: "BR", color: "#00843D", category: "news", tier: "premium", variantAffinity: ["world"] },
  { id: "hls-canalgov", label: "CANAL GOV", hlsUrl: "https://canalgov-stream.ebc.com.br/index.m3u8", type: "hls", region: "latam", lang: "pt", country: "BR", color: "#003DA6", category: "news", tier: "premium" },
  { id: "hls-tvcamara", label: "TV C\u00c2MARA", hlsUrl: "https://stream3.camara.gov.br/tv1/manifest.m3u8", type: "hls", region: "latam", lang: "pt", country: "BR", color: "#0055A4", category: "news", tier: "premium" },
  { id: "hls-tvbrasil", label: "TV BRASIL", hlsUrl: "https://tvbrasil-stream.ebc.com.br/index.m3u8", type: "hls", region: "latam", lang: "pt", country: "BR", color: "#FFD700", category: "news", tier: "premium" },
  { id: "hls-jpnews", label: "JOVEM PAN NEWS", hlsUrl: "https://d6yfbj4xxtrod.cloudfront.net/out/v1/7836eb391ec24452b149f3dc6df15bbd/index.m3u8", type: "hls", region: "latam", lang: "pt", country: "BR", color: "#FF4500", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // LATIN AMERICA — CHILE
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-24hchile", label: "24 HORAS CHILE", hlsUrl: "https://d32rw80ytx9uxs.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-vlldndmow4yre/24HES.m3u8", type: "hls", region: "latam", lang: "es", country: "CL", color: "#003DA6", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // LATIN AMERICA — MEXICO
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-adn40", label: "ADN 40", hlsUrl: "https://mdstrm.com/live-stream-playlist/60b578b060947317de7b57ac.m3u8", type: "hls", region: "latam", lang: "es", country: "MX", color: "#FF6B00", category: "news", tier: "premium" },
  { id: "hls-forotv", label: "FORO TV", hlsUrl: "https://channel02-notusa.akamaized.net/hls/live/2023914/event01/index.m3u8", type: "hls", region: "latam", lang: "es", country: "MX", color: "#003DA6", category: "news", tier: "premium" },
  { id: "hls-teleformula", label: "TELEF\u00d3RMULA", hlsUrl: "https://mdstrm.com/live-stream-playlist/62f2c855f7981b5a5a2d8763.m3u8", type: "hls", region: "latam", lang: "es", country: "MX", color: "#E30613", category: "news", tier: "premium" },
  { id: "hls-capital21", label: "CAPITAL 21", hlsUrl: "https://video.cdmx.gob.mx/redes/stream.m3u8", type: "hls", region: "latam", lang: "es", country: "MX", color: "#0055A4", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // LATIN AMERICA — ARGENTINA
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-a24", label: "A24", hlsUrl: "https://g5.vxral-slo.transport.edge-access.net/a12/ngrp:a24-100056_all/playlist.m3u8?sense=true", type: "hls", region: "latam", lang: "es", country: "AR", color: "#FF6600", category: "news", tier: "premium" },
  { id: "hls-tvpublica", label: "TV PUBLICA", hlsUrl: "https://ola1.com.ar/tvp/index.m3u8", type: "hls", region: "latam", lang: "es", country: "AR", color: "#003DA6", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // LATIN AMERICA — COLOMBIA
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-cablenoticias", label: "CABLENOTICIAS", hlsUrl: "https://5ea86ddd14ce7.streamlock.net/live/cable09061970/playlist.m3u8", type: "hls", region: "latam", lang: "es", country: "CO", color: "#FFD700", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // LATIN AMERICA — PERU
  // ═══════════════════════════════════════════════════════════════
  { id: "hls-rpptv", label: "RPP TV", hlsUrl: "https://redirector.rudo.video/hls-video/567ffde3fa319fadf3419efda25619456231dfea/rpptv/rpptv.smil/playlist.m3u8", type: "hls", region: "latam", lang: "es", country: "PE", color: "#E30613", category: "news", tier: "premium" },
  { id: "hls-tvperu", label: "TV PERU", hlsUrl: "https://cdnhd.iblups.com/hls/777b4d4cc0984575a7d14f6ee57dbcaf7.m3u8", type: "hls", region: "latam", lang: "es", country: "PE", color: "#003DA6", category: "news", tier: "premium" },
  { id: "hls-tvperu-noticias", label: "TV PERU NOTICIAS", hlsUrl: "https://cdnhd.iblups.com/hls/902c1a0395264f269f1160efa00660e47.m3u8", type: "hls", region: "latam", lang: "es", country: "PE", color: "#0055A4", category: "news", tier: "premium" },

  // ═══════════════════════════════════════════════════════════════
  // SPORTS CHANNELS (iptv-org sourced — 290 channels)
  // ═══════════════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════════════
  // TURKEY SPORTS
  // ════════════════════════════════════════════════════════════
  { id: "hls-sport-fb-tv", label: "FB TV", hlsUrl: "http://1hskrdto.rocketcdn.com/fenerbahcetv.smil/playlist.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-gem-fit", label: "GEM FIT", hlsUrl: "https://ca-rt.onetv.app/gemfit/index-0.m3u8?token=onetv202", type: "hls", region: "tr", lang: "tr", country: "TR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-gem-sport", label: "GEM SPORT", hlsUrl: "https://steep-wildflower-284d.nhhwkiszzzvcuojxdo.workers.dev/?url=https://gg.hls2.xyz/live/IR+-+GEM+Sport/chunks.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-htspor-tv", label: "HTSPOR TV", hlsUrl: "https://ciner.daioncdn.net/ht-spor/ht-spor.m3u8?app=web", type: "hls", region: "tr", lang: "tr", country: "TR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-s-sport", label: "S SPORT", hlsUrl: "https://bcovlive-a.akamaihd.net/540fcb034b144b848e7ff887f61a293a/eu-central-1/6415845530001/profile_0/chunklist.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-s-sport-2", label: "S SPORT 2", hlsUrl: "https://bcovlive-a.akamaihd.net/29c60f23ea4840ba8726925a77fcfd0b/eu-central-1/6415845530001/profile_0/chunklist.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-sports-tv", label: "SPORTS TV", hlsUrl: "https://live.sportstv.com.tr/hls/low/sportstv.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tabii-spor-6", label: "TABII SPOR 6", hlsUrl: "https://vbtob9hyq58eiophct5qctxr2.medya.trt.com.tr/master.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tjk-tv", label: "TJK TV", hlsUrl: "https://tjktv-live.tjk.org/tjktv.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tjk-tv-2", label: "TJK TV 2", hlsUrl: "https://tjktv-live.tjk.org/tjktv2/tjktv2.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-trt-spor", label: "TRT SPOR", hlsUrl: "https://tv-trtspor1.medya.trt.com.tr/master.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-trt-spor-yildiz", label: "TRT SPOR YILDIZ", hlsUrl: "https://tv-trtspor2.medya.trt.com.tr/master.m3u8", type: "hls", region: "tr", lang: "tr", country: "TR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  // ════════════════════════════════════════════════════════════
  // US & CANADA SPORTS
  // ════════════════════════════════════════════════════════════
  { id: "hls-sport-fight-network", label: "FIGHT NETWORK", hlsUrl: "https://d12a2vxqkkh1bo.cloudfront.net/hls/main.m3u8", type: "hls", region: "us", lang: "en", country: "CA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-game", label: "GAME+", hlsUrl: "https://a-cdn.klowdtv.com/live2/fntsy_720p/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "CA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-hard-knocks", label: "HARD KNOCKS", hlsUrl: "https://d3uyzhwvmemdyf.cloudfront.net/v1/master/9d062541f2ff39b5c0f48b743c6411d25f62fc25/Hard-Knocks-DistroTV/109.m3u8?ads.vf=6pOF6kgy418", type: "hls", region: "us", lang: "en", country: "CA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-nba-tv-canada", label: "NBA TV CANADA", hlsUrl: "http://user.scalecdn.co:8080/live/54706135/09221986/3092.m3u8", type: "hls", region: "us", lang: "en", country: "CA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tsn1", label: "TSN1", hlsUrl: "https://tvpass.org/live/tsn1/hd", type: "hls", region: "us", lang: "en", country: "CA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tsn2", label: "TSN2", hlsUrl: "https://tvpass.org/live/tsn2/hd", type: "hls", region: "us", lang: "en", country: "CA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tsn3", label: "TSN3", hlsUrl: "https://tvpass.org/live/tsn3/hd", type: "hls", region: "us", lang: "en", country: "CA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tsn4", label: "TSN4", hlsUrl: "https://tvpass.org/live/tsn4/hd", type: "hls", region: "us", lang: "en", country: "CA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tsn5", label: "TSN5", hlsUrl: "https://tvpass.org/live/tsn5/hd", type: "hls", region: "us", lang: "en", country: "CA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tsn-the-ocho", label: "TSN THE OCHO", hlsUrl: "https://d3pnbvng3bx2nj.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-rds8g35qfqrnv/TSN_The_Ocho.m3u8", type: "hls", region: "us", lang: "en", country: "CA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-30a-golf-kingdom", label: "30A GOLF KINGDOM", hlsUrl: "https://30a-tv.com/feeds/vidaa/golf.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-accdn", label: "ACCDN", hlsUrl: "https://raycom-accdn-firetv.amagi.tv/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-acl-cornhole-tv", label: "ACL CORNHOLE TV", hlsUrl: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/acl-cornhole-tv/aclco.m3u8?ads.vf=Sl3XhzpgcOy", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-bein-sports-xtra", label: "BEIN SPORTS XTRA", hlsUrl: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/bein-sports-xtra/playlist.m3u8?ads.vf=kBQplLldqQO", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-bein-sports-xtra-en-espanol", label: "BEIN SPORTS XTRA EN ESPANOL", hlsUrl: "https://dc1644a9jazgj.cloudfront.net/beIN_Sports_Xtra_Espanol.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-bek-tv-sports-west", label: "BEK TV SPORTS WEST", hlsUrl: "https://cdn3.wowza.com/5/ZWQ1K2NYTmpFbGsr/BEK-WOWZA-1/smil:BEKPRIMEW.smil/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-bellator-mma", label: "BELLATOR MMA", hlsUrl: "https://jmp2.uk/plu-5ebc8688f3697d00072f7cf8.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-billiard-tv", label: "BILLIARD TV", hlsUrl: "https://1621590671.rsc.cdn77.org/HLS/BILLIARDTV.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-cbs-sports-golazo-network", label: "CBS SPORTS GOLAZO NETWORK", hlsUrl: "https://proped3fhg87.airspace-cdn.cbsivideo.com/golazo-live-dai/master/golazo-live-dai.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-cbs-sports-hq", label: "CBS SPORTS HQ", hlsUrl: "https://propee33f9c2.airspace-cdn.cbsivideo.com/index.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-draftkings-network", label: "DRAFTKINGS NETWORK", hlsUrl: "https://na.linear.zype.com/e0bd0e23-a958-4e43-8164-4f2fef8876a8/fd3614bd-90bf-4530-a277-65ae3a1720c8-zype/live.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-espn8-the-ocho", label: "ESPN8 THE OCHO", hlsUrl: "https://d3b6q2ou5kp8ke.cloudfront.net/ESPNTheOcho.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-espn-deportes", label: "ESPN DEPORTES", hlsUrl: "https://e3.thetvapp.to/hls/espn-deportes/index.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fanduel-racing", label: "FANDUEL RACING", hlsUrl: "https://d3ehq1uaxory6w.cloudfront.net/out/v1/35c05f080f4e49a4b4eb031b5a14e505/TVG2index_2.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fanduel-tv", label: "FANDUEL TV", hlsUrl: "https://d2jl8r92tdc3f1.cloudfront.net/out/v1/59419700344b4625b7cb0693ba265ea3/TVGindex_1.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fite-24-7", label: "FITE 24/7", hlsUrl: "https://d3d85c7qkywguj.cloudfront.net/scheduler/scheduleMaster/263.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fox-sports-2", label: "FOX SPORTS 2", hlsUrl: "https://tvpass.org/live/FoxSports2/hd", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fox-sports-en-espanol", label: "FOX SPORTS EN ESPANOL", hlsUrl: "https://live-manifest.production-public.tubi.io/live/d906efca-1302-4e29-b0d9-9a1d7a305d69/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-ftf-sports", label: "FTF SPORTS", hlsUrl: "https://1657061170.rsc.cdn77.org/HLS/FTF-LINEAR.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fubo-sports-network", label: "FUBO SPORTS NETWORK", hlsUrl: "https://dnf08l6u6uxnz.cloudfront.net/master.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-glory-kickboxing", label: "GLORY KICKBOXING", hlsUrl: "https://6f972d29.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWV1X0dsb3J5S2lja2JveGluZ19ITFM/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-glory-kickboxing-2", label: "GLORY KICKBOXING", hlsUrl: "https://jmp2.uk/plu-5417a212ff9fba68282fbf5e.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-golf-channel", label: "GOLF CHANNEL", hlsUrl: "https://tvpass.org/live/GolfChannel/hd", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-golf-channel-latin-america", label: "GOLF CHANNEL LATIN AMERICA", hlsUrl: "http://181.114.57.246:4000/play/BHGDIhvdyuw/index.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-horizon-sports", label: "HORIZON SPORTS", hlsUrl: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/horizon-sports/master.m3u8?ads.vf=A5pc7nNS254", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-kcmn-ld6", label: "KCMN-LD6", hlsUrl: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg02873-kravemedia-mtrspt1-distrotv/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-lacrosse-tv", label: "LACROSSE TV", hlsUrl: "https://1840769862.rsc.cdn77.org/FTF/LSN_SCTE.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-lucha-libre-aaa", label: "LUCHA LIBRE AAA", hlsUrl: "https://jmp2.uk/plu-5c01df1759ee03633e7b272c.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-mlb-channel", label: "MLB CHANNEL", hlsUrl: "https://pb-2y9ox4r1fy550.akamaized.net/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-mma-tv", label: "MMA-TV", hlsUrl: "http://31.148.48.15/M1_Global/index.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-msg", label: "MSG", hlsUrl: "https://tvpass.org/live/msg-madison-square-gardens/hd", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-msg-plus", label: "MSG PLUS", hlsUrl: "https://tvpass.org/live/msg-plus/hd", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-nba-tv", label: "NBA TV", hlsUrl: "https://amg00556-amg00556c3-firetv-us-6060.playouts.now.amagi.tv/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-nbc-sports-bay-area", label: "NBC SPORTS BAY AREA", hlsUrl: "https://tvpass.org/live/nbc-sports-bay-area/hd", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-nbc-sports-boston", label: "NBC SPORTS BOSTON", hlsUrl: "https://tvpass.org/live/nbc-sports-boston/hd", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-nbc-sports-now", label: "NBC SPORTS NOW", hlsUrl: "https://d4whmvwm0rdvi.cloudfront.net/10007/99993008/hls/master.m3u8?ads.xumo_channelId=99993008", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-nbc-sports-philadelphia", label: "NBC SPORTS PHILADELPHIA", hlsUrl: "https://tvpass.org/live/nbc-sports-philadelphia/hd", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-nfl-channel", label: "NFL CHANNEL", hlsUrl: "https://pb-we3ltka9xobj6.akamaized.net/master.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-nfl-redzone", label: "NFL REDZONE", hlsUrl: "https://tvpass.org/live/NFLRedZone/hd", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-nhra-tv", label: "NHRA TV", hlsUrl: "https://d265y4sk8257lt.cloudfront.net/nh.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-overtime", label: "OVERTIME", hlsUrl: "https://d1a8aq6t30gkqj.cloudfront.net/v1/amc_overtime_1/samsungheadend_us/latest/main/hls/playlist_hd.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-pac-12-insider", label: "PAC 12 INSIDER", hlsUrl: "https://pac12-firetv.amagi.tv/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-pbr-ridepass", label: "PBR RIDEPASS", hlsUrl: "https://jmp2.uk/plu-60d39387706fe50007fda8e8.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-pga-tour", label: "PGA TOUR", hlsUrl: "https://pb-783hpus5r91wv.akamaized.net/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-poker-go", label: "POKER GO", hlsUrl: "https://aegis-cloudfront-1.tubi.video/b474c2bb-b34d-4c53-a94b-c4ffe884563c/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-racer-network", label: "RACER NETWORK", hlsUrl: "https://amg00378-mavtv-amg00378c2-samsung-au-1790.playouts.now.amagi.tv/playlist/amg00378-mavtvfast-motorsportsnetwork-samsungau/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-racer-select", label: "RACER SELECT", hlsUrl: "https://d85qrcmltdfp8.cloudfront.net/MAVTV_Select.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-right-now-tv", label: "RIGHT NOW TV", hlsUrl: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/right-now-tv/playlist.m3u8?ads.vf=XXIrbw6_Odq", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-sportsgrid", label: "SPORTSGRID", hlsUrl: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/sportsgrid/master.m3u8?ads.vf=8ukz5gCI8vu", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-sportstvplus", label: "SPORTSTVPLUS", hlsUrl: "https://d3s7x6kmqcnb6b.cloudfront.net/d/distro001a/NKXQTWMREOB2XFJRLAHO/hls3/now,-1m/m.m3u8?ads.vf=SqsoCl37PjC", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-stadium", label: "STADIUM", hlsUrl: "https://wurl120sports.global.transmit.live/hls/679a907dce42a042c23ace37/v1/stadium_gracenote/samsung_us/latest/main/hls/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-strongman", label: "STRONGMAN", hlsUrl: "https://rightsboosterltd-scl-1-eu.rakuten.wurl.tv/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-strongman-champions-league", label: "STRONGMAN CHAMPIONS LEAGUE", hlsUrl: "https://rightsboosterltd-scl-2-eu.rakuten.wurl.tv/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-swerve-combat", label: "SWERVE COMBAT", hlsUrl: "https://linear-253.frequency.stream/mt/roku/253/hls/master/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tennis-channel", label: "TENNIS CHANNEL", hlsUrl: "https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischannelnl-samsungnl/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tennischannel-2", label: "TENNISCHANNEL 2", hlsUrl: "https://jmp2.uk/plu-681109b688b9d85d0938c6ba.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tvs-bowling-network", label: "TVS BOWLING NETWORK", hlsUrl: "https://rpn.bozztv.com/gusa/gusa-tvsbowling/index.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tvs-boxing", label: "TVS BOXING", hlsUrl: "https://rpn.bozztv.com/gusa/gusa-tvsboxing/index.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tvs-classic-sports", label: "TVS CLASSIC SPORTS", hlsUrl: "https://rpn.bozztv.com/gusa/gusa-tvs/index.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tvs-sports", label: "TVS SPORTS", hlsUrl: "https://rpn.bozztv.com/gusa/gusa-tvssports/index.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tvs-sports-bureau", label: "TVS SPORTS BUREAU", hlsUrl: "https://rpn.bozztv.com/gusa/gusa-tvssportsbureau/index.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tvs-turbo", label: "TVS TURBO", hlsUrl: "https://rpn.bozztv.com/gusa/gusa-tvsturbo/index.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tvs-women-sports", label: "TVS WOMEN SPORTS", hlsUrl: "https://rpn.bozztv.com/gusa/gusa-tvswsn/index.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-unbeaten-sports-channel", label: "UNBEATEN SPORTS CHANNEL", hlsUrl: "https://d1t5afz6qed3xk.cloudfront.net/Unbeaten.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-usa-network-east", label: "USA NETWORK EAST", hlsUrl: "https://tvpass.org/live/USANetworkEast/hd", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-w14dk-d-14-5-all-sports-television-network", label: "W14DK-D 14.5 ALL SPORTS TELEVISION NETWORK", hlsUrl: "https://2-fss-2.streamhoster.com/pl_118/204972-2205186-1/playlist.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-willow-sports", label: "WILLOW SPORTS", hlsUrl: "https://d36r8jifhgsk5j.cloudfront.net/Willow_TV.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-world-poker-tour", label: "WORLD POKER TOUR", hlsUrl: "https://jmp2.uk/plu-5ad9b7aae738977e2c312132.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-world-poker-tour-2", label: "WORLD POKER TOUR", hlsUrl: "https://d39g1vxj2ef6in.cloudfront.net/v1/master/3fec3e5cac39a52b2132f9c66c83dae043dc17d4/prod-rakuten-stitched/playlist.m3u8?ads.xumo_channelId=88883102", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-world-poker-tour-3", label: "WORLD POKER TOUR", hlsUrl: "https://jmp2.uk/plu-5ad8d796e738977e2c31094a.m3u8", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-world-poker-tour-4", label: "WORLD POKER TOUR", hlsUrl: "https://d3w4n3hhseniak.cloudfront.net/v1/master/9d062541f2ff39b5c0f48b743c6411d25f62fc25/WPT-DistroTV/150.m3u8?ads.vf=EHEabFVWNva", type: "hls", region: "us", lang: "en", country: "US", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  // ════════════════════════════════════════════════════════════
  // EUROPE SPORTS
  // ════════════════════════════════════════════════════════════
  { id: "hls-sport-rtsh-sport", label: "RTSH SPORT", hlsUrl: "http://178.33.11.6:8696/live/rtshsport/playlist.m3u8", type: "hls", region: "eu", lang: "sq", country: "AL", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-k19", label: "K19", hlsUrl: "https://1853185335.rsc.cdn77.org/K192/tv/playlist.m3u8", type: "hls", region: "eu", lang: "de", country: "AT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-red-bull-tv", label: "RED BULL TV", hlsUrl: "https://3ea22335.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWdiX1JlZEJ1bGxUVl9ITFM/playlist.m3u8", type: "hls", region: "eu", lang: "de", country: "AT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-red-bull-tv-2", label: "RED BULL TV", hlsUrl: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8", type: "hls", region: "eu", lang: "de", country: "AT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-red-bull-tv-au", label: "RED BULL TV AU", hlsUrl: "https://db34cc6127ac459db55cab5f97cd66b9.mediatailor.us-west-2.amazonaws.com/v1/master/ba62fe743df0fe93366eba3a257d792884136c7f/LINEAR-680-WORBAUENFAST-WHALETVPLUS/680/whaletvplus/hls/master/playlist.m3u8", type: "hls", region: "eu", lang: "de", country: "AT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-red-bull-tv-br", label: "RED BULL TV BR", hlsUrl: "https://d03ae6b5c6724c24867e97a3dc04934a.mediatailor.us-west-2.amazonaws.com/v1/master/ba62fe743df0fe93366eba3a257d792884136c7f/LINEAR-1026-WORBBRPTFAST-WHALETVPLUS/1026/hls/master/playlist.m3u8", type: "hls", region: "eu", lang: "de", country: "AT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-red-bull-tv-de", label: "RED BULL TV DE", hlsUrl: "https://46cfeb23c7f74853bba7a256655a3119.mediatailor.us-west-2.amazonaws.com/v1/master/ba62fe743df0fe93366eba3a257d792884136c7f/LINEAR-582-WORBDACHDEFAST-WHALETVPLUS/582/whaletvplus/hls/master/playlist.m3u8", type: "hls", region: "eu", lang: "de", country: "AT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-red-bull-tv-es", label: "RED BULL TV ES", hlsUrl: "https://886bd3fbc782459f8de7555d32d7e9ce.mediatailor.us-west-2.amazonaws.com/v1/master/ba62fe743df0fe93366eba3a257d792884136c7f/LINEAR-957-WORBLATAMESFAST-WHALETVPLUS/957/whaletvplus/hls/master/playlist.m3u8", type: "hls", region: "eu", lang: "de", country: "AT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-red-bull-tv-uk", label: "RED BULL TV UK", hlsUrl: "https://1a3566cb46914c5499fbc86fbc4ac87e.mediatailor.us-west-2.amazonaws.com/v1/master/ba62fe743df0fe93366eba3a257d792884136c7f/LINEAR-932-WORBUKENFAST-WHALETVPLUS/932/whaletvplus/hls/master/playlist.m3u8", type: "hls", region: "eu", lang: "de", country: "AT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-red-bull-tv-us", label: "RED BULL TV US", hlsUrl: "https://0b73ace69ebb45eaa249bb87837cb958.mediatailor.us-west-2.amazonaws.com/v1/master/ba62fe743df0fe93366eba3a257d792884136c7f/LINEAR-644-WORBUSENFAST-LG_US/644/lgtv/hls/master/playlist.m3u8", type: "hls", region: "eu", lang: "de", country: "AT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-the-cycling-channel", label: "THE CYCLING CHANNEL", hlsUrl: "https://cyclingtv.playout.vju.tv/cyclingtv/main.m3u8", type: "hls", region: "eu", lang: "de", country: "AT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-5", label: "БЕЛАРУСЬ 5", hlsUrl: "https://ngtrk.dc.beltelecom.by/ngtrk/smil:belarus5.smil/playlist.m3u8", type: "hls", region: "eu", lang: "ru", country: "BY", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-5-2", label: "БЕЛАРУСЬ 5 ИНТЕРНЕТ", hlsUrl: "https://edge59.dc.beltelecom.by/ngtrk/smil:belarus5int.smil/playlist.m3u8", type: "hls", region: "eu", lang: "ru", country: "BY", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-ski-tv", label: "SKI TV", hlsUrl: "https://d2xeo83q8fcni6.cloudfront.net/v1/master/9d062541f2ff39b5c0f48b743c6411d25f62fc25/SkiTV-SportsTribal/193.m3u8", type: "hls", region: "eu", lang: "de", country: "CH", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-t-sport", label: "ČT SPORT", hlsUrl: "http://88.212.15.19/live/test_ctsport_25p/playlist.m3u8", type: "hls", region: "eu", lang: "cs", country: "CZ", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-more-than-sports-tv", label: "MORE THAN SPORTS TV", hlsUrl: "https://mts1.iptv-playoutcenter.de/mts/mts-web/playlist.m3u8", type: "hls", region: "eu", lang: "de", country: "DE", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-sportdigital-fussball-hd", label: "SPORTDIGITAL FUSSBALL HD", hlsUrl: "https://live20.bozztv.com/akamaissh101/ssh101/sportdigtal1/playlist.m3u8", type: "hls", region: "eu", lang: "de", country: "DE", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-world-of-freesports", label: "WORLD OF FREESPORTS", hlsUrl: "https://mainstreammedia-worldoffreesportsintl-rakuten.amagi.tv/hls/amagi_hls_data_rakutenAA-mainstreammediafreesportsintl-rakuten/CDN/master.m3u8", type: "hls", region: "eu", lang: "de", country: "DE", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-world-of-freesports-2", label: "WORLD OF FREESPORTS", hlsUrl: "https://mainstreammedia-worldoffreesportsintl-rakuten.amagi.tv/playlist.m3u8", type: "hls", region: "eu", lang: "de", country: "DE", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-barca-tv", label: "BARCA TV", hlsUrl: "https://live20.bozztv.com/dvrfl06/astv/astv-barca/index.m3u8", type: "hls", region: "eu", lang: "es", country: "ES", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-esport3", label: "ESPORT3", hlsUrl: "https://directes-tv-int.3catdirectes.cat/live-content/esport3-hls/master.m3u8", type: "hls", region: "eu", lang: "es", country: "ES", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-esport3-2", label: "ESPORT3", hlsUrl: "https://directes-tv-cat.3catdirectes.cat/live-content/esport3-hls/master.m3u8", type: "hls", region: "eu", lang: "es", country: "ES", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-gol-classics", label: "GOL CLASSICS", hlsUrl: "https://d71gqtnep83vb.cloudfront.net/gol_classics/gol_classics.m3u8", type: "hls", region: "eu", lang: "es", country: "ES", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-olympic-channel", label: "OLYMPIC CHANNEL", hlsUrl: "https://ocshls-2-olympicchannel.akamaized.net/ocshls/OCTV_32.m3u8", type: "hls", region: "eu", lang: "es", country: "ES", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-realmadrid-tv", label: "REALMADRID TV", hlsUrl: "https://jmp2.uk/plu-63dac28760bc8f0008a7654b.m3u8", type: "hls", region: "eu", lang: "es", country: "ES", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-teledeporte", label: "TELEDEPORTE", hlsUrl: "https://d1cctoeg0n48w5.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-mnixw9wn5ugmv/TeledeporteES.m3u8", type: "hls", region: "eu", lang: "es", country: "ES", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-viaplay-tv", label: "VIAPLAY TV (FINLAND)", hlsUrl: "https://live-fi.tvkaista.net/viaplay-tv/live.m3u8?hd=true", type: "hls", region: "eu", lang: "fi", country: "FI", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-africa-24-sport", label: "AFRICA 24 SPORT", hlsUrl: "https://africa24.vedge.infomaniak.com/livecast/ik:africa24sport/manifest.m3u8", type: "hls", region: "eu", lang: "fr", country: "FR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-equidia", label: "EQUIDIA", hlsUrl: "https://raw.githubusercontent.com/Paradise-91/ParaTV/main/streams/equidia/live2.m3u8", type: "hls", region: "eu", lang: "fr", country: "FR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-kozoom-tv", label: "KOZOOM TV", hlsUrl: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/kozoom-tv/manifest.m3u8?ads.vf=CAJPqH6STD0", type: "hls", region: "eu", lang: "fr", country: "FR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-l-equipe", label: "L'EQUIPE", hlsUrl: "https://dshn8inoshngm.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-gac2i63dmu8b7/LEquipe_FR.m3u8", type: "hls", region: "eu", lang: "fr", country: "FR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-persiana-fight", label: "PERSIANA FIGHT", hlsUrl: "https://fighthls.persiana.live/hls/stream.m3u8", type: "hls", region: "eu", lang: "fr", country: "FR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-trace-sport-stars", label: "TRACE SPORT STARS (AUSTRALIA)", hlsUrl: "https://lightning-tracesport-samsungau.amagi.tv/playlist.m3u8", type: "hls", region: "eu", lang: "fr", country: "FR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-ert-sports-1", label: "ERT SPORTS 1", hlsUrl: "http://hbbtvapp.ert.gr/stream.php/v/vid_ertsports_mpeg.2ts", type: "hls", region: "eu", lang: "el", country: "GR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-ert-sports-2", label: "ERT SPORTS 2", hlsUrl: "http://hbbtvapp.ert.gr/stream.php/v/vid_ertplay2_mpeg.2ts", type: "hls", region: "eu", lang: "el", country: "GR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-l-verseny-k-zvet-t-s", label: "LÓVERSENY KÖZVETÍTÉS", hlsUrl: "http://87.229.103.60:1935/liverelay/loverseny2.sdp/playlist.m3u8", type: "hls", region: "eu", lang: "hu", country: "HU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-m4-sport", label: "M4 SPORT", hlsUrl: "http://88.212.15.19/live/m4_hun/index.m3u8", type: "hls", region: "eu", lang: "hu", country: "HU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-f1-channel", label: "F1 CHANNEL", hlsUrl: "https://jmp2.uk/plu-65c69ee3d77d450008c80438.m3u8", type: "hls", region: "eu", lang: "en", country: "IE", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-f1-channel-2", label: "F1 CHANNEL", hlsUrl: "https://amg12058-c15studio-amg12058c1-lg-us-5787.playouts.now.amagi.tv/playlist.m3u8", type: "hls", region: "eu", lang: "en", country: "IE", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-aci-sport-tv", label: "ACI SPORT TV", hlsUrl: "https://webstream.multistream.it/memfs/e2cb3629-c1a2-495b-b43a-9eb386f04ed8.m3u8", type: "hls", region: "eu", lang: "it", country: "IT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-horse-tv", label: "HORSE TV", hlsUrl: "https://a-cdn.klowdtv.com/live2/horsetv_720p/playlist.m3u8", type: "hls", region: "eu", lang: "it", country: "IT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-madeinbo-tv", label: "MADEINBO TV", hlsUrl: "https://srvx1.selftv.video/dmchannel/live/playlist.m3u8", type: "hls", region: "eu", lang: "it", country: "IT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-nautical-channel", label: "NAUTICAL CHANNEL", hlsUrl: "https://a-cdn.klowdtv.com/live2/nautical_720p/playlist.m3u8", type: "hls", region: "eu", lang: "it", country: "IT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-rai-sport-hd", label: "RAI SPORT HD", hlsUrl: "https://viamotionhsi.netplus.ch/live/eds/raisport1/browser-dash/raisport1.mpd", type: "hls", region: "eu", lang: "it", country: "IT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-sport-italia", label: "SPORT ITALIA", hlsUrl: "https://amg01370-italiansportcom-sportitalia-rakuten-3hmdb.amagi.tv/hls/amagi_hls_data_rakutenAA-sportitalia-rakuten/CDN/master.m3u8", type: "hls", region: "eu", lang: "it", country: "IT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-sportitalia-24", label: "SPORTITALIA 24", hlsUrl: "https://di-yx2saj20.vo.lswcdn.net/sportitalia/smil:silive24.smil/playlist.m3u8", type: "hls", region: "eu", lang: "it", country: "IT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-sportitalia-motori", label: "SPORTITALIA MOTORI", hlsUrl: "https://di-yx2saj20.vo.lswcdn.net/sportitalia/smil:simotori.smil/playlist.m3u8", type: "hls", region: "eu", lang: "it", country: "IT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-sportitalia-solocalcio", label: "SPORTITALIA SOLOCALCIO", hlsUrl: "https://distribution.sportitalialive.it/sportitalia/sisolocalcio_abr/playlist.m3u8", type: "hls", region: "eu", lang: "it", country: "IT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tr-sport", label: "TR SPORT", hlsUrl: "https://livetr.teleromagna.it/mia/live/playlist.m3u8", type: "hls", region: "eu", lang: "it", country: "IT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-lrt-plius", label: "LRT PLIUS", hlsUrl: "https://stream-live.lrt.lt/plius/master.m3u8", type: "hls", region: "eu", lang: "lt", country: "LT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-m-net-sport", label: "M-NET SPORT", hlsUrl: "http://ares.mnet.mk/hls/mnet-sport.m3u8", type: "hls", region: "eu", lang: "mk", country: "MK", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fightbox", label: "FIGHTBOX", hlsUrl: "https://liveovh010.cda.pl/zkr7GNESGht4_0Wk12c78A/17538736/2782059/enc002/fightboxhdraw/fightboxhdraw.m3u8", type: "hls", region: "eu", lang: "nl", country: "NL", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-introuble", label: "INTROUBLE", hlsUrl: "https://amg00861-amg00861c6-stirr-us-8229.playouts.now.amagi.tv/playlist.m3u8", type: "hls", region: "eu", lang: "nl", country: "NL", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-cafe-futbol", label: "CAFE FUTBOL", hlsUrl: "http://cdn-s-lb2.pluscdn.pl/lv/1517831/350/dash/e32e6046/live.mpd", type: "hls", region: "eu", lang: "pl", country: "PL", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-extreme-sports-channel-polska", label: "EXTREME SPORTS CHANNEL POLSKA", hlsUrl: "https://liveovh010.cda.pl/2SHZi_SkX4h0MDflza1PPw/1753748478/3480440/enc124/extremesportshdraw/extremesportshdraw.mpd", type: "hls", region: "eu", lang: "pl", country: "PL", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-gramy-dalej", label: "GRAMY DALEJ", hlsUrl: "http://cdn-s-lb2.pluscdn.pl/lv/1517832/351/dash/2699af69/live.mpd", type: "hls", region: "eu", lang: "pl", country: "PL", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-racer-international", label: "RACER INTERNATIONAL", hlsUrl: "https://amg00378-mavtv-amg00378c2-rakuten-us-1048.playouts.now.amagi.tv/playlist/amg00378-mavtvfast-motorsportsnetwork-rakutenus/playlist.m3u8", type: "hls", region: "eu", lang: "pl", country: "PL", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tvp-sport", label: "TVP SPORT", hlsUrl: "https://estreams.tv.nej.cz/dash/CH_TVP_SPORT_Portable.ism/playlist.mpd", type: "hls", region: "eu", lang: "pl", country: "PL", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fuel-tv", label: "FUEL TV", hlsUrl: "https://amg01074-fueltv-fueltvau-samsungau-g09kq.amagi.tv/playlist/amg01074-fueltv-fueltvau-samsungau/playlist.m3u8", type: "hls", region: "eu", lang: "pt", country: "PT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fuel-tv-2", label: "FUEL TV", hlsUrl: "https://amg01074-fueltv-fueltvemeaen-rakuten-b6j62.amagi.tv/hls/amagi_hls_data_rakutenAA-fueltvemeaen/CDN/master.m3u8", type: "hls", region: "eu", lang: "pt", country: "PT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fuel-tv-3", label: "FUEL TV", hlsUrl: "https://amg01074-fueltv-amg01074c1-stirr-us-4214.playouts.now.amagi.tv/playlist.m3u8", type: "hls", region: "eu", lang: "pt", country: "PT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fuel-tv-4", label: "FUEL TV", hlsUrl: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/fuel-tv/playlist.m3u8?ads.vf=gbdyvfXODOK", type: "hls", region: "eu", lang: "pt", country: "PT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-antenasport", label: "ANTENASPORT", hlsUrl: "https://hls.rundletv.eu.org/LIVE$AntenaSport/6.m3u8/Level/300720051?end=END&start=LIVE", type: "hls", region: "eu", lang: "ro", country: "RO", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-realitatea-sportiva", label: "REALITATEA SPORTIVA", hlsUrl: "https://stream.realitatea.net/realitatea/sportiva_md/ts:playlist.m3u8", type: "hls", region: "eu", lang: "ro", country: "RO", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tvr-sport", label: "TVR SPORT", hlsUrl: "https://tvr-sport.lg.mncdn.com/tvrsport/smil:tvrsport.smil/chunklist_b5160000.m3u8", type: "hls", region: "eu", lang: "ro", country: "RO", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-sos-kanal-plus", label: "SOS KANAL PLUS", hlsUrl: "https://53be5ef2d13aa.streamlock.net/soskanalplus/soskanalplus.stream/playlist.m3u8", type: "hls", region: "eu", lang: "sr", country: "RS", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-khl", label: "KHL", hlsUrl: "http://31.148.48.15/KHL_TV/index.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-khl-prime", label: "KHL PRIME", hlsUrl: "http://31.148.48.15/KHL_TV_HD/index.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-match-strana", label: "MATCH! STRANA", hlsUrl: "http://31.148.48.15/Match_Strana/index.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-mma-tv-com", label: "MMA TV.COM", hlsUrl: "https://streams2.sofast.tv/vglive-sk-462904/playlist.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-vital-drive", label: "VITAL DRIVE", hlsUrl: "https://autopilot.catcast.tv/content/37909/index.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-ru-sport", label: "АСТРАХАНЬ.RU SPORT", hlsUrl: "https://streaming.astrakhan.ru/astrakhanrusporthd/playlist.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-", label: "БОКС ТВ", hlsUrl: "http://31.148.48.15/Boks_TV/index.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport--2", label: "МАТЧ! АРЕНА", hlsUrl: "http://31.148.48.15/Match_Arena_HD/index.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport--3", label: "МАТЧ! БОЕЦ", hlsUrl: "http://31.148.48.15/Match_Boec/index.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport--4", label: "МАТЧ! ИГРА", hlsUrl: "http://31.148.48.15/Match_Igra_HD/index.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport--5", label: "МАТЧ! ПЛАНЕТА", hlsUrl: "https://cdn4.skygo.mn/live/disk1/Match_Planeta/HLSv3-FTA/Match_Planeta.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport--6", label: "РУССКИЙ ЭКСТРИМ", hlsUrl: "http://31.148.48.15/Russkiy_Ekstrim/index.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport--7", label: "СТАРТ ТРИУМФ", hlsUrl: "https://bl.webcaster.pro/media/playlist/free_fe8dc1b768a84b8b0333db826471f17e_hd/33_85479982/1080p/8666c3e935faf6ef47ffd601e8e48868/4821408969.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport--9", label: "ФУТБОЛ", hlsUrl: "http://31.148.48.15/Futbol_HD/index.m3u8", type: "hls", region: "eu", lang: "ru", country: "RU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-atg-live", label: "ATG LIVE", hlsUrl: "https://kanal75xto-llhls.akamaized.net/live/Data/atg-kanal-15-02a-rr/HLS-Legacy-HL/atg-kanal-15-02a-rr.m3u8", type: "hls", region: "eu", lang: "sv", country: "SE", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-port", label: ":ŠPORT", hlsUrl: "http://88.212.15.27/live/test_rtvs_sport_hevc/playlist.m3u8", type: "hls", region: "eu", lang: "sk", country: "SK", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-san-marino-rtv-sport", label: "SAN MARINO RTV SPORT", hlsUrl: "https://d2hrvno5bw6tg2.cloudfront.net/smrtv-ch02/smil:ch-02.smil/master.m3u8", type: "hls", region: "eu", lang: "it", country: "SM", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-suspilne-sport", label: "SUSPILNE. SPORT", hlsUrl: "https://cdnua05.hls.tv/934/hls/8743361621b245838bee193c9ec28322/4856/stream.m3u8", type: "hls", region: "eu", lang: "uk", country: "UA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-dazn-combat", label: "DAZN COMBAT", hlsUrl: "https://dazn-combat-rakuten.amagi.tv/hls/amagi_hls_data_rakutenAA-dazn-combat-rakuten/CDN/master.m3u8", type: "hls", region: "eu", lang: "en", country: "UK", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fifa", label: "FIFA+", hlsUrl: "https://a62dad94.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWV1X0ZJRkFQbHVzRW5nbGlzaF9ITFM/playlist.m3u8", type: "hls", region: "eu", lang: "en", country: "UK", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fifa-french", label: "FIFA+ FRENCH", hlsUrl: "https://37b4c228.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWZyX0ZJRkFQbHVzRnJlbmNoX0hMUw/playlist.m3u8", type: "hls", region: "eu", lang: "en", country: "UK", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fifa-german", label: "FIFA+ GERMAN", hlsUrl: "https://4397879b.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWRlX0ZJRkFQbHVzR2VybWFuX0hMUw/playlist.m3u8", type: "hls", region: "eu", lang: "en", country: "UK", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fifa-hispanic-america", label: "FIFA+ HISPANIC AMERICA", hlsUrl: "https://6c849fb3.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctbXhfRklGQVBsdXNTcGFuaXNoLTFfSExT/playlist.m3u8", type: "hls", region: "eu", lang: "en", country: "UK", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fifa-italy", label: "FIFA+ ITALY", hlsUrl: "https://5d95f7d7.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWl0X0ZJRkFQbHVzSXRhbGlhbl9ITFM/playlist.m3u8", type: "hls", region: "eu", lang: "en", country: "UK", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fifa-portuguese", label: "FIFA+ PORTUGUESE", hlsUrl: "https://e3be9ac5.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctYnJfRklGQVBsdXNQb3J0dWd1ZXNlX0hMUw/playlist.m3u8", type: "hls", region: "eu", lang: "en", country: "UK", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fifa-spain", label: "FIFA+ SPAIN", hlsUrl: "https://d63fabad.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWVzX0ZJRkFQbHVzU3BhbmlzaF9ITFM/playlist.m3u8", type: "hls", region: "eu", lang: "en", country: "UK", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fifa-united-states", label: "FIFA+ UNITED STATES", hlsUrl: "https://d2w9q46ikgrcwx.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-of5cbk3sav3w5/v1/sysdata_s_p_a_fifa_7/samsungheadend_us/latest/main/hls/playlist.m3u8", type: "hls", region: "eu", lang: "en", country: "UK", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-fifa-women", label: "FIFA+ WOMEN", hlsUrl: "https://cffda8ff.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/U2Ftc3VuZy1nYl9GSUZBUGx1c3dvbWVuX0hMUw/playlist.m3u8", type: "hls", region: "eu", lang: "en", country: "UK", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-mutv", label: "MUTV", hlsUrl: "https://bcovlive-a.akamaihd.net/r2d2c4ca5bf57456fb1d16255c1a535c8/eu-west-1/6058004203001/playlist.m3u8", type: "hls", region: "eu", lang: "en", country: "UK", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-talksport", label: "TALKSPORT", hlsUrl: "https://af7a8b4e.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctZ2JfdGFsa1NQT1JUX0hMUw/playlist.m3u8", type: "hls", region: "eu", lang: "en", country: "UK", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  // ════════════════════════════════════════════════════════════
  // MIDDLE EAST SPORTS
  // ════════════════════════════════════════════════════════════
  { id: "hls-sport-sharjah-sports", label: "SHARJAH SPORTS", hlsUrl: "https://svs.itworkscdn.net/smc4sportslive/smc4.smil/playlist.m3u8", type: "hls", region: "mideast", lang: "ar", country: "AE", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-rta-sport", label: "RTA SPORT", hlsUrl: "https://rtatv.akamaized.net/Content/HLS/Live/channel(RTA3)/index.m3u8", type: "hls", region: "mideast", lang: "fa", country: "AF", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-bahrain-sports-1", label: "BAHRAIN SPORTS 1", hlsUrl: "https://5c7b683162943.streamlock.net/live/ngrp:sportsone_all/playlist.m3u8", type: "hls", region: "mideast", lang: "ar", country: "BH", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-bahrain-sports-2", label: "BAHRAIN SPORTS 2", hlsUrl: "https://5c7b683162943.streamlock.net/live/ngrp:bahrainsportstwo_all/playlist.m3u8", type: "hls", region: "mideast", lang: "ar", country: "BH", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-irib3", label: "IRIB3", hlsUrl: "https://ncdn.telewebion.ir/tv3/live/playlist.m3u8", type: "hls", region: "mideast", lang: "fa", country: "IR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-varzesh-tv", label: "VARZESH TV", hlsUrl: "https://ncdn.telewebion.ir/varzesh/live/playlist.m3u8", type: "hls", region: "mideast", lang: "fa", country: "IR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-jordan-sport", label: "JORDAN SPORT", hlsUrl: "https://jrtv-live.ercdn.net/jordansporthd/jordansporthd.m3u8", type: "hls", region: "mideast", lang: "ar", country: "JO", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-jordan-sport-2", label: "JORDAN SPORT 2", hlsUrl: "https://jrtv-live.ercdn.net/learning2/learning2.m3u8", type: "hls", region: "mideast", lang: "ar", country: "JO", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-ktv-sport", label: "KTV SPORT", hlsUrl: "https://kwtspta.cdn.mangomolo.com/sp/smil:sp.stream.smil/chunklist.m3u8", type: "hls", region: "mideast", lang: "ar", country: "KW", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-ktv-sport-plus", label: "KTV SPORT PLUS", hlsUrl: "https://kwtsplta.cdn.mangomolo.com/spl/smil:spl.stream.smil/chunklist.m3u8", type: "hls", region: "mideast", lang: "ar", country: "KW", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-oman-sports-tv", label: "OMAN SPORTS TV", hlsUrl: "https://partneta.cdn.mgmlcdn.com/omsport/smil:omsport.stream.smil/chunklist.m3u8", type: "hls", region: "mideast", lang: "ar", country: "OM", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-alkass-five", label: "ALKASS FIVE", hlsUrl: "https://liveeu-gcp.alkassdigital.net/alkass5-p/main.m3u8", type: "hls", region: "mideast", lang: "ar", country: "QA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-alkass-four", label: "ALKASS FOUR", hlsUrl: "https://liveeu-gcp.alkassdigital.net/alkass4-p/main.m3u8", type: "hls", region: "mideast", lang: "ar", country: "QA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-alkass-one", label: "ALKASS ONE", hlsUrl: "https://liveeu-gcp.alkassdigital.net/alkass1-p/main.m3u8", type: "hls", region: "mideast", lang: "ar", country: "QA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-alkass-seven", label: "ALKASS SEVEN", hlsUrl: "https://liveeu-gcp.alkassdigital.net/alkass7-p/main.m3u8", type: "hls", region: "mideast", lang: "ar", country: "QA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-alkass-shoof", label: "ALKASS SHOOF", hlsUrl: "https://liveeu-gcp.alkassdigital.net/shooflive/main.m3u8", type: "hls", region: "mideast", lang: "ar", country: "QA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-alkass-shoof-2", label: "ALKASS SHOOF 2", hlsUrl: "https://liveeu-gcp.alkassdigital.net/shooflive2/main.m3u8", type: "hls", region: "mideast", lang: "ar", country: "QA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-alkass-six", label: "ALKASS SIX", hlsUrl: "https://liveeu-gcp.alkassdigital.net/alkass6-p/main.m3u8", type: "hls", region: "mideast", lang: "ar", country: "QA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-alkass-three", label: "ALKASS THREE", hlsUrl: "https://liveeu-gcp.alkassdigital.net/alkass3-p/main.m3u8", type: "hls", region: "mideast", lang: "ar", country: "QA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-alkass-two", label: "ALKASS TWO", hlsUrl: "https://liveeu-gcp.alkassdigital.net/alkass2-p/main.m3u8", type: "hls", region: "mideast", lang: "ar", country: "QA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  // ════════════════════════════════════════════════════════════
  // ASIA & PACIFIC SPORTS
  // ════════════════════════════════════════════════════════════
  { id: "hls-sport-cricket-gold", label: "CRICKET GOLD", hlsUrl: "https://streams2.sofast.tv/scheduler/scheduleMaster/418.m3u8", type: "hls", region: "asia", lang: "en", country: "AU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-racing-com", label: "RACING.COM", hlsUrl: "https://racingvic-i.akamaized.net/hls/live/598695/racingvic/index1500.m3u8", type: "hls", region: "asia", lang: "en", country: "AU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-sky-racing-1", label: "SKY RACING 1", hlsUrl: "https://skylivetab-new.akamaized.net/hls/live/2038780/sky1/index.m3u8", type: "hls", region: "asia", lang: "en", country: "AU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-sky-racing-2", label: "SKY RACING 2", hlsUrl: "https://skylivetab-new.akamaized.net/hls/live/2038781/sky2/index.m3u8", type: "hls", region: "asia", lang: "en", country: "AU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-sky-thoroughbred-central", label: "SKY THOROUGHBRED CENTRAL", hlsUrl: "https://skylivetab-new.akamaized.net/hls/live/2038782/stcsd/index.m3u8", type: "hls", region: "asia", lang: "en", country: "AU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-cbc-sport", label: "CBC SPORT", hlsUrl: "https://mn-nl.mncdn.com/cbcsports_live/cbcsports/playlist.m3u8", type: "hls", region: "asia", lang: "az", country: "AZ", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-t-sports", label: "T SPORTS", hlsUrl: "https://tvsen7.aynaott.com/tsportshd/index.m3u8", type: "hls", region: "asia", lang: "bn", country: "BD", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-cctv-5", label: "CCTV-5", hlsUrl: "http://123.175.209.52:9003/hls/5/index.m3u8", type: "hls", region: "asia", lang: "zh", country: "CN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-cctv-5-2", label: "CCTV-5+", hlsUrl: "http://123.175.209.52:9003/hls/6/index.m3u8", type: "hls", region: "asia", lang: "zh", country: "CN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-cctv-16", label: "CCTV-16", hlsUrl: "http://123.175.209.52:9003/hls/17/index.m3u8", type: "hls", region: "asia", lang: "zh", country: "CN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-game-channel", label: "GAME CHANNEL", hlsUrl: "http://49.113.179.174:4022/udp/238.125.1.36:5140", type: "hls", region: "asia", lang: "zh", country: "CN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-smg-football-channel", label: "SMG FOOTBALL CHANNEL", hlsUrl: "http://49.113.179.174:4022/udp/238.125.2.142:5140", type: "hls", region: "asia", lang: "zh", country: "CN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport--10", label: "山东体育", hlsUrl: "http://livealone302.iqilu.com/iqilu/typd.m3u8", type: "hls", region: "asia", lang: "zh", country: "CN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport--11", label: "江苏体育", hlsUrl: "http://183.207.248.71/gitv/live1/G_JSTY/G_JSTY", type: "hls", region: "asia", lang: "zh", country: "CN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-adjarasport-1", label: "ADJARASPORT 1", hlsUrl: "https://live20.bozztv.com/dvrfl05/gin-adjara/index.m3u8", type: "hls", region: "asia", lang: "ka", country: "GE", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-sin-po-tv", label: "SIN PO TV", hlsUrl: "https://cdn10jtedge.indihometv.com/atm/DASH/sinpotv/manifest.mpd", type: "hls", region: "asia", lang: "id", country: "ID", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tvri-sport", label: "TVRI SPORT", hlsUrl: "https://ott-balancer.tvri.go.id/live/eds/SportHD/hls/SportHD.m3u8", type: "hls", region: "asia", lang: "id", country: "ID", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-dd-sports-sd", label: "DD SPORTS SD", hlsUrl: "https://d3qs3d2rkhfqrt.cloudfront.net/out/v1/b17adfe543354fdd8d189b110617cddd/index.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-sony-sports-ten-2-hd", label: "SONY SPORTS TEN 2 HD", hlsUrl: "http://103.229.254.25:7001/play/a02t/index.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-sony-sports-ten-3-hindi", label: "SONY SPORTS TEN 3 HINDI", hlsUrl: "http://103.229.254.25:7001/play/a09q/index.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-sony-sports-ten-5", label: "SONY SPORTS TEN 5", hlsUrl: "http://103.99.249.139/sonyten3/index.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-sony-sports-ten-5-hd", label: "SONY SPORTS TEN 5 HD", hlsUrl: "http://116.90.120.151:8000/play/a0hb/index.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-star-sports-1-hd", label: "STAR SPORTS 1 HD", hlsUrl: "http://116.90.120.151:8000/play/a0gs/index.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-star-sports-1-hindi", label: "STAR SPORTS 1 HINDI", hlsUrl: "http://116.90.120.151:8000/play/a0h1/index.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-star-sports-1-hindi-hd", label: "STAR SPORTS 1 HINDI HD", hlsUrl: "http://116.90.120.151:8000/play/a0je/index.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-star-sports-2-hd", label: "STAR SPORTS 2 HD", hlsUrl: "http://116.90.120.151:8000/play/a0jb/index.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-star-sports-2-hindi", label: "STAR SPORTS 2 HINDI", hlsUrl: "http://116.90.120.151:8000/play/a0jc/index.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-star-sports-2-hindi-hd", label: "STAR SPORTS 2 HINDI HD", hlsUrl: "http://116.90.120.151:8000/play/a0hi/index.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-star-sports-3", label: "STAR SPORTS 3", hlsUrl: "http://103.161.153.165:8000/play/a05p/index.m3u8", type: "hls", region: "asia", lang: "hi", country: "IN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-gaora-sports", label: "GAORA SPORTS", hlsUrl: "http://cdns.jp-primehome.com:8000/zhongying/live/playlist.m3u8?cid=cs17", type: "hls", region: "asia", lang: "ja", country: "JP", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-golf-network", label: "GOLF NETWORK", hlsUrl: "http://cdns.jp-primehome.com:8000/zhongying/live/playlist.m3u8?cid=cs03", type: "hls", region: "asia", lang: "ja", country: "JP", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-j-sports-1", label: "J SPORTS 1", hlsUrl: "http://cdns.jp-primehome.com:8000/zhongying/live/playlist.m3u8?cid=bs18", type: "hls", region: "asia", lang: "ja", country: "JP", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-j-sports-2", label: "J SPORTS 2", hlsUrl: "http://cdns.jp-primehome.com:8000/zhongying/live/playlist.m3u8?cid=bs19", type: "hls", region: "asia", lang: "ja", country: "JP", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-j-sports-3", label: "J SPORTS 3", hlsUrl: "http://cdns.jp-primehome.com:8000/zhongying/live/playlist.m3u8?cid=bs21", type: "hls", region: "asia", lang: "ja", country: "JP", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-j-sports-4", label: "J SPORTS 4", hlsUrl: "http://cdns.jp-primehome.com:8000/zhongying/live/playlist.m3u8?cid=bs22", type: "hls", region: "asia", lang: "ja", country: "JP", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-nittele-g-plus", label: "NITTELE G PLUS", hlsUrl: "http://cdns.jp-primehome.com:8000/zhongying/live/playlist.m3u8?cid=cs02", type: "hls", region: "asia", lang: "ja", country: "JP", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport--8", label: "УТРК СПОРТ", hlsUrl: "https://st2.mediabay.tv/KG_KTRK-Sport/index.m3u8", type: "hls", region: "asia", lang: "ky", country: "KG", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-qazsport", label: "QAZSPORT", hlsUrl: "https://qazsporttv-stream.qazcdn.com/qazsporttv/qazsporttv/playlist.m3u8", type: "hls", region: "asia", lang: "kk", country: "KZ", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-mnb-sport", label: "MNB SPORT", hlsUrl: "https://live.mnb.mn/hls/mnb_sport.stream.m3u8", type: "hls", region: "asia", lang: "mn", country: "MN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tdm-sports-ch-93", label: "TDM SPORTS CH. 93", hlsUrl: "https://live3.tdm.com.mo/ch4/sport_ch4.live/playlist.m3u8", type: "hls", region: "asia", lang: "pt", country: "MO", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-pro-sport-international", label: "PRO SPORT INTERNATIONAL", hlsUrl: "https://proshls.wns.live/hls/stream.m3u8", type: "hls", region: "asia", lang: "ms", country: "MY", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-nudge-sports-channel", label: "NUDGE SPORTS CHANNEL", hlsUrl: "https://streams.comclark.com/live_input/nudge_sports/playlist.m3u8", type: "hls", region: "asia", lang: "en", country: "PH", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-premier-sports", label: "PREMIER SPORTS", hlsUrl: "https://amg19223-amg19223c3-amgplt0351.playout.now3.amagi.tv/playlist/amg19223-amg19223c3-amgplt0351/playlist.m3u8", type: "hls", region: "asia", lang: "en", country: "PH", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-premier-sports-2", label: "PREMIER SPORTS 2", hlsUrl: "https://amg19223-amg19223c4-amgplt0351.playout.now3.amagi.tv/playlist/amg19223-amg19223c4-amgplt0351/playlist.m3u8", type: "hls", region: "asia", lang: "en", country: "PH", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-one-golf", label: "ONE GOLF", hlsUrl: "http://162.250.201.58:6211/pk/ONEGOLF/index.m3u8", type: "hls", region: "asia", lang: "ur", country: "PK", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-ptv-sports", label: "PTV SPORTS", hlsUrl: "http://103.250.28.74:8000/play/a019/index.m3u8", type: "hls", region: "asia", lang: "ur", country: "PK", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-ten-sports-pakistan", label: "TEN SPORTS PAKISTAN", hlsUrl: "http://121.91.61.106:8000/play/a04h/index.m3u8", type: "hls", region: "asia", lang: "ur", country: "PK", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-futbol", label: "FUTBOL", hlsUrl: "https://live.teleradiocom.tj/8/3m.m3u8", type: "hls", region: "asia", lang: "tg", country: "TJ", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-t-rkmenistan-sport", label: "TÜRKMENISTAN SPORT", hlsUrl: "https://alpha.tv.online.tm/hls/ch004.m3u8", type: "hls", region: "asia", lang: "tk", country: "TM", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-ng-nai-2", label: "ĐỒNG NAI 2", hlsUrl: "http://118.107.85.4:1935/live/smil:DNTV2.smil/chunklist.m3u8", type: "hls", region: "asia", lang: "vi", country: "VN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-htv-th-thao", label: "HTV THỂ THAO", hlsUrl: "https://live.fptplay53.net/epzhd1/htvcthethao_vhls.smil/chunklist.m3u8", type: "hls", region: "asia", lang: "vi", country: "VN", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  // ════════════════════════════════════════════════════════════
  // LATIN AMERICA SPORTS
  // ════════════════════════════════════════════════════════════
  { id: "hls-sport-tyc-sports", label: "TYC SPORTS", hlsUrl: "https://live-04-11-tyc24.vodgc.net/tyc24/index_tyc24_1080.m3u8", type: "hls", region: "latam", lang: "es", country: "AR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-ftv", label: "FTV", hlsUrl: "https://master.tucableip.com/ftvhd/index.m3u8", type: "hls", region: "latam", lang: "es", country: "BO", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-zoy-tv-sports-1", label: "ZOY TV SPORTS 1", hlsUrl: "https://mio.zoymilton.com/ZoyEventos/index.m3u8", type: "hls", region: "latam", lang: "es", country: "BO", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-canal-do-inter", label: "CANAL DO INTER", hlsUrl: "https://video01.soultv.com.br/internacional/internacional/playlist.m3u8", type: "hls", region: "latam", lang: "pt", country: "BR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-combate-global", label: "COMBATE GLOBAL", hlsUrl: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=960", type: "hls", region: "latam", lang: "pt", country: "BR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tvmatic-fight", label: "TVMATIC FIGHT", hlsUrl: "http://cdn.tvmatic.net/fight.m3u8", type: "hls", region: "latam", lang: "pt", country: "BR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tnc-sports", label: "TNC SPORTS", hlsUrl: "https://streamer1.nexgen.bz/TNC_SPORTS/index.m3u8", type: "hls", region: "latam", lang: "en", country: "BZ", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-teletrak", label: "TELETRAK", hlsUrl: "https://unlimited6-cl.dps.live/sportinghd/sportinghd.smil/playlist.m3u8", type: "hls", region: "latam", lang: "es", country: "CL", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-turf-movil", label: "TURF MOVIL", hlsUrl: "https://tvturf4.janus.cl/playlist/stream.m3u8?d=w&id=", type: "hls", region: "latam", lang: "es", country: "CL", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-radio-turrialba-tv-sports", label: "RADIO TURRIALBA TV SPORTS", hlsUrl: "https://live-stream.iblups.com/live/a5ae024a1bbc4a05a68debbc9d379db6bb6a6da3.m3u8", type: "hls", region: "latam", lang: "es", country: "CR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tigo-sports", label: "TIGO SPORTS", hlsUrl: "https://live20.bozztv.com/akamaissh101/ssh101/livetigocr/playlist.m3u8", type: "hls", region: "latam", lang: "es", country: "CR", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tele-rebelde", label: "TELE REBELDE", hlsUrl: "https://tv.picta.cu/telerebelde/telerebelde_1.m3u8", type: "hls", region: "latam", lang: "es", country: "CU", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-cdn-deportes", label: "CDN DEPORTES", hlsUrl: "http://200.125.170.122:8000/play/a03j/index.m3u8", type: "hls", region: "latam", lang: "es", country: "DO", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-colimdot-tv", label: "COLIMDOT TV", hlsUrl: "https://cnn.livestreaminggroup.info:3132/live/colimdotvlive.m3u8", type: "hls", region: "latam", lang: "es", country: "DO", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tour-spot-tv", label: "TOUR SPOT TV", hlsUrl: "https://fox.hostlagarto.com:8081/toursporttv/playlist.m3u8", type: "hls", region: "latam", lang: "es", country: "DO", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-multivisi-n-sports", label: "MULTIVISIÓN SPORTS", hlsUrl: "https://stream.digitalgt.com:3605/live/multivisionsportslive.m3u8", type: "hls", region: "latam", lang: "es", country: "GT", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-itv-deportes", label: "ITV DEPORTES", hlsUrl: "https://thm-it-roku.otteravision.com/thm/it/it.m3u8", type: "hls", region: "latam", lang: "es", country: "MX", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-monterrico-tv", label: "MONTERRICO TV", hlsUrl: "https://www.opencaster.com/resources/hls_stream/hipodromojcp2.m3u8", type: "hls", region: "latam", lang: "es", country: "PE", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-ovacion-tv", label: "OVACION TV", hlsUrl: "http://cdn2.ujjina.com:1935/iptvovacion1/liveovacion1tv/playlist.m3u8", type: "hls", region: "latam", lang: "es", country: "PE", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-awapa-sports-tv", label: "AWAPA SPORTS TV", hlsUrl: "https://mgv-awapa.akamaized.net/hls/live/2104282/MGV_CHANNEL15/master.m3u8", type: "hls", region: "latam", lang: "es", country: "SV", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-tigo-sports-tv-el-salvador", label: "TIGO SPORTS TV EL SALVADOR", hlsUrl: "https://channel03.tigosports.com.sv/out/v1/31f36d52d558475ca18799d8ca5e4b40/index.m3u8", type: "hls", region: "latam", lang: "es", country: "SV", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-as3-sport-tv", label: "AS3 SPORT TV", hlsUrl: "https://streamtv.as3sport.online:3394/hybrid/play.m3u8", type: "hls", region: "latam", lang: "es", country: "VE", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-meridiano-tv", label: "MERIDIANO TV", hlsUrl: "https://e1.viginet.vectormax.com:5210/quickstart/114-934-21/index.m3u8", type: "hls", region: "latam", lang: "es", country: "VE", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  // ════════════════════════════════════════════════════════════
  // AFRICA SPORTS
  // ════════════════════════════════════════════════════════════
  { id: "hls-sport-ado-tv", label: "ADO TV", hlsUrl: "https://strhls.streamakaci.tv/ortb/ortb2-multi/playlist.m3u8", type: "hls", region: "africa", lang: "fr", country: "BJ", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-rti-la-3", label: "RTI LA 3", hlsUrl: "http://69.64.57.208/la3/index.m3u8", type: "hls", region: "africa", lang: "fr", country: "CI", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-arryadia", label: "ARRYADIA", hlsUrl: "http://5.253.46.190:8000/play/a0ea/index.m3u8", type: "hls", region: "africa", lang: "ar", country: "MA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-arryadia-hd", label: "ARRYADIA HD", hlsUrl: "http://5.253.46.190:8000/play/a0bi/index.m3u8", type: "hls", region: "africa", lang: "ar", country: "MA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-arryadia-hd1", label: "ARRYADIA HD1", hlsUrl: "http://5.253.46.190:8000/play/a0dq/index.m3u8", type: "hls", region: "africa", lang: "ar", country: "MA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  { id: "hls-sport-sports-connect", label: "SPORTS CONNECT", hlsUrl: "https://streamdot.broadpeak.io/cff02a74da64d1459391ce1f72d58f1a/afxpstr/SportsConnect/index.m3u8", type: "hls", region: "africa", lang: "en", country: "ZA", category: "sports", tier: "premium", variantAffinity: ["sports"] },
  // ════════════════════════════════════════════════════════════
  // OTHER SPORTS
  // ════════════════════════════════════════════════════════════
  { id: "hls-sport-alfa-sport", label: "ALFA SPORT", hlsUrl: "https://dev.aftermind.xyz/edge-hls/unitrust/alfasports/index.m3u8?token=8TXWzhY3h6jrzqEqx", type: "hls", region: "global", lang: "en", country: "CY", category: "sports", tier: "premium", variantAffinity: ["sports"] },
];
