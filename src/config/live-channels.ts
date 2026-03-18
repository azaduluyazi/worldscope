/**
 * Live news broadcast channels — YouTube 24/7 live streams.
 * Channel IDs are stable; video IDs may need periodic updates.
 *
 * To find a channel's live stream:
 * https://www.youtube.com/@ChannelName/live
 */

export interface LiveChannel {
  id: string;
  label: string;
  /** YouTube channel ID */
  channelId: string;
  /** Fallback: specific video ID if channel embed fails */
  videoId?: string;
  /** Region/language tag */
  region: "global" | "us" | "eu" | "tr" | "mideast" | "asia";
  /** Accent color for the tab */
  color?: string;
}

export const LIVE_CHANNELS: LiveChannel[] = [
  // ── Global / English ──
  {
    id: "aljazeera",
    label: "AL JAZEERA",
    channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg",
    videoId: "gCNeDWCI0vo",
    region: "global",
    color: "#D4AA00",
  },
  {
    id: "france24",
    label: "FRANCE 24",
    channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg",
    videoId: "h3MuIUNCCzI",
    region: "eu",
    color: "#00A1E4",
  },
  {
    id: "dw",
    label: "DW NEWS",
    channelId: "UCknLrEdhRCp1aegoMqRaCZg",
    videoId: "GE_SfNbYa-s",
    region: "eu",
    color: "#0077B6",
  },
  {
    id: "skynews",
    label: "SKY NEWS",
    channelId: "UCoMdktPbSTixAyNGwb-UYkQ",
    videoId: "9Auq9mYxFEE",
    region: "global",
    color: "#C41230",
  },
  {
    id: "euronews",
    label: "EURONEWS",
    channelId: "UCW2QcKZiU8aUGg4yxCIditg",
    videoId: "pykpO5kQJ98",
    region: "eu",
    color: "#003DA6",
  },
  {
    id: "cnbc",
    label: "CNBC",
    channelId: "UCvJJ_dzjViJCoLf5uKUTwoA",
    videoId: "9NyxcX3rhQs",
    region: "us",
    color: "#005594",
  },
  {
    id: "bloomberg",
    label: "BLOOMBERG",
    channelId: "UCIALMKvObZNtJ68-rmLjXoA",
    videoId: "oPmFnOCSLyA",
    region: "us",
    color: "#2800D7",
  },
  {
    id: "trtworld",
    label: "TRT WORLD",
    channelId: "UC7fWeaHhqgM4Lba4UMBwtpw",
    videoId: "CV5Fooi8VIA",
    region: "tr",
    color: "#E30613",
  },
  {
    id: "alarabiya",
    label: "AL ARABIYA",
    channelId: "UCWwJMD-04gJBFOxsPjRcPOg",
    videoId: "1sMp-5L8M6A",
    region: "mideast",
    color: "#B8860B",
  },
  {
    id: "nhkworld",
    label: "NHK WORLD",
    channelId: "UCQ-HoOMBFmBCVFkGcgSBzZA",
    videoId: "f0lYkMGwJFc",
    region: "asia",
    color: "#E60012",
  },
];

/**
 * Live webcam feeds from key global cities.
 * YouTube-based webcams with stable stream IDs.
 */
export interface LiveWebcam {
  id: string;
  city: string;
  country: string;
  /** YouTube video ID */
  videoId: string;
  /** Region tab */
  region: "mideast" | "europe" | "americas" | "asia" | "space";
  /** Live indicator color */
  color: string;
}

export const LIVE_WEBCAMS: LiveWebcam[] = [
  // ── Middle East ──
  {
    id: "jerusalem",
    city: "Jerusalem",
    country: "IL",
    videoId: "jJbKaOFjqiI",
    region: "mideast",
    color: "#ff4757",
  },
  {
    id: "mecca",
    city: "Mecca",
    country: "SA",
    videoId: "gRbiBkFbh0E",
    region: "mideast",
    color: "#ffd000",
  },
  {
    id: "dubai",
    city: "Dubai",
    country: "AE",
    videoId: "GfB5dbkh1QU",
    region: "mideast",
    color: "#00e5ff",
  },

  // ── Europe ──
  {
    id: "london",
    city: "London",
    country: "GB",
    videoId: "54m573U9dz0",
    region: "europe",
    color: "#00e5ff",
  },
  {
    id: "paris",
    city: "Paris",
    country: "FR",
    videoId: "26PFj9-3Cqg",
    region: "europe",
    color: "#8a5cf6",
  },
  {
    id: "rome",
    city: "Rome",
    country: "IT",
    videoId: "A8r44Bz5XEY",
    region: "europe",
    color: "#00ff88",
  },

  // ── Americas ──
  {
    id: "nyc",
    city: "New York",
    country: "US",
    videoId: "1-iS7LArMPA",
    region: "americas",
    color: "#ffd000",
  },
  {
    id: "miami",
    city: "Miami",
    country: "US",
    videoId: "FhLCABMlo1c",
    region: "americas",
    color: "#00ff88",
  },

  // ── Asia ──
  {
    id: "tokyo",
    city: "Tokyo",
    country: "JP",
    videoId: "DjYZk8nrXVY",
    region: "asia",
    color: "#ff4757",
  },
  {
    id: "seoul",
    city: "Seoul",
    country: "KR",
    videoId: "8Jqfl3GM3GU",
    region: "asia",
    color: "#00e5ff",
  },

  // ── Space ──
  {
    id: "iss",
    city: "ISS",
    country: "SPACE",
    videoId: "P9C25Un7xaM",
    region: "space",
    color: "#8a5cf6",
  },
];

export const WEBCAM_REGIONS = [
  { id: "all", label: "ALL" },
  { id: "mideast", label: "MIDDLE EAST" },
  { id: "europe", label: "EUROPE" },
  { id: "americas", label: "AMERICAS" },
  { id: "asia", label: "ASIA" },
  { id: "space", label: "SPACE" },
] as const;
