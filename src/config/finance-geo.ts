/**
 * Finance/Trading geographic data — stock exchanges, financial centers,
 * central banks, and commodity hubs for the Finance variant map overlay.
 *
 * Data sourced from GFCI rankings, WFE statistics, and public records.
 * Coordinates are approximate center-of-building or center-of-city.
 */

export interface FinanceGeoPoint {
  id: string;
  name: string;
  shortName: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  type: "exchange" | "financial-center" | "central-bank" | "commodity-hub";
  tier: "mega" | "major" | "regional" | "offshore";
  /** Extra detail shown in popup */
  detail?: string;
  /** Market cap in trillions (exchanges only) */
  marketCap?: number;
}

// ═══════════════════════════════════════════════════════════════
// STOCK EXCHANGES — 30 major exchanges worldwide
// ═══════════════════════════════════════════════════════════════
export const STOCK_EXCHANGES: FinanceGeoPoint[] = [
  // Mega (>$5T)
  { id: "nyse", name: "New York Stock Exchange", shortName: "NYSE", city: "New York", country: "US", lat: 40.7069, lng: -74.0113, type: "exchange", tier: "mega", marketCap: 28.0, detail: "Largest exchange by market cap" },
  { id: "nasdaq", name: "NASDAQ", shortName: "NASDAQ", city: "New York", country: "US", lat: 40.7568, lng: -73.9860, type: "exchange", tier: "mega", marketCap: 24.0, detail: "Tech-heavy electronic exchange" },
  { id: "sse", name: "Shanghai Stock Exchange", shortName: "SSE", city: "Shanghai", country: "CN", lat: 31.2333, lng: 121.4865, type: "exchange", tier: "mega", marketCap: 7.4, detail: "Largest exchange in China" },
  { id: "euronext", name: "Euronext", shortName: "Euronext", city: "Amsterdam", country: "NL", lat: 52.3465, lng: 4.8790, type: "exchange", tier: "mega", marketCap: 7.2, detail: "Pan-European exchange" },
  { id: "jpx", name: "Japan Exchange Group", shortName: "JPX/TSE", city: "Tokyo", country: "JP", lat: 35.6803, lng: 139.7717, type: "exchange", tier: "mega", marketCap: 6.5, detail: "Tokyo Stock Exchange" },

  // Major ($1T-$5T)
  { id: "szse", name: "Shenzhen Stock Exchange", shortName: "SZSE", city: "Shenzhen", country: "CN", lat: 22.5367, lng: 114.0571, type: "exchange", tier: "major", marketCap: 4.8, detail: "Tech-oriented Chinese exchange" },
  { id: "hkex", name: "Hong Kong Stock Exchange", shortName: "HKEX", city: "Hong Kong", country: "HK", lat: 22.2832, lng: 114.1569, type: "exchange", tier: "major", marketCap: 4.5, detail: "Gateway to Chinese markets" },
  { id: "lse", name: "London Stock Exchange", shortName: "LSE", city: "London", country: "GB", lat: 51.5155, lng: -0.0922, type: "exchange", tier: "major", marketCap: 3.4, detail: "Europe's largest exchange" },
  { id: "nse-india", name: "National Stock Exchange of India", shortName: "NSE", city: "Mumbai", country: "IN", lat: 19.0557, lng: 72.8525, type: "exchange", tier: "major", marketCap: 3.6, detail: "India's largest exchange by volume" },
  { id: "tsx", name: "Toronto Stock Exchange", shortName: "TSX", city: "Toronto", country: "CA", lat: 43.6489, lng: -79.3818, type: "exchange", tier: "major", marketCap: 2.8, detail: "Canada's largest exchange" },
  { id: "tadawul", name: "Saudi Exchange", shortName: "Tadawul", city: "Riyadh", country: "SA", lat: 24.7103, lng: 46.6770, type: "exchange", tier: "major", marketCap: 2.9, detail: "Saudi Arabia's exchange" },
  { id: "xetra", name: "Deutsche Börse (Xetra)", shortName: "Xetra", city: "Frankfurt", country: "DE", lat: 50.1110, lng: 8.6804, type: "exchange", tier: "major", marketCap: 2.3, detail: "Germany's primary exchange" },
  { id: "krx", name: "Korea Exchange", shortName: "KRX", city: "Seoul", country: "KR", lat: 37.5230, lng: 126.9258, type: "exchange", tier: "major", marketCap: 2.2, detail: "South Korea's exchange" },
  { id: "twse", name: "Taiwan Stock Exchange", shortName: "TWSE", city: "Taipei", country: "TW", lat: 25.0388, lng: 121.5632, type: "exchange", tier: "major", marketCap: 2.0, detail: "Taiwan's primary exchange" },
  { id: "six", name: "SIX Swiss Exchange", shortName: "SIX", city: "Zurich", country: "CH", lat: 47.3685, lng: 8.5400, type: "exchange", tier: "major", marketCap: 2.0, detail: "Switzerland's primary exchange" },
  { id: "asx", name: "Australian Securities Exchange", shortName: "ASX", city: "Sydney", country: "AU", lat: -33.8672, lng: 151.2067, type: "exchange", tier: "major", marketCap: 1.7, detail: "Australia's primary exchange" },

  // Emerging/Regional
  { id: "b3", name: "B3 Brasil Bolsa Balcão", shortName: "B3", city: "São Paulo", country: "BR", lat: -23.5486, lng: -46.6341, type: "exchange", tier: "regional", marketCap: 0.9, detail: "Brazil's stock exchange" },
  { id: "jse", name: "Johannesburg Stock Exchange", shortName: "JSE", city: "Johannesburg", country: "ZA", lat: -26.1088, lng: 28.0318, type: "exchange", tier: "regional", marketCap: 1.2, detail: "Africa's largest exchange" },
  { id: "sgx", name: "Singapore Exchange", shortName: "SGX", city: "Singapore", country: "SG", lat: 1.2794, lng: 103.8498, type: "exchange", tier: "major", marketCap: 0.7, detail: "Singapore's exchange" },
  { id: "idx", name: "Indonesia Stock Exchange", shortName: "IDX", city: "Jakarta", country: "ID", lat: -6.2293, lng: 106.8130, type: "exchange", tier: "regional", marketCap: 0.6, detail: "Indonesia's primary exchange" },
  { id: "bmv", name: "Bolsa Mexicana de Valores", shortName: "BMV", city: "Mexico City", country: "MX", lat: 19.4345, lng: -99.1424, type: "exchange", tier: "regional", marketCap: 0.5, detail: "Mexico's stock exchange" },
  { id: "moex", name: "Moscow Exchange", shortName: "MOEX", city: "Moscow", country: "RU", lat: 55.7539, lng: 37.6084, type: "exchange", tier: "regional", marketCap: 0.6, detail: "Russia's largest exchange" },
  { id: "tase", name: "Tel Aviv Stock Exchange", shortName: "TASE", city: "Tel Aviv", country: "IL", lat: 32.0669, lng: 34.7856, type: "exchange", tier: "regional", marketCap: 0.3, detail: "Israel's exchange" },
];

// ═══════════════════════════════════════════════════════════════
// FINANCIAL CENTERS — GFCI-ranked global finance hubs
// ═══════════════════════════════════════════════════════════════
export const FINANCIAL_CENTERS: FinanceGeoPoint[] = [
  // Global tier
  { id: "fc-nyc", name: "New York", shortName: "NYC", city: "New York", country: "US", lat: 40.7580, lng: -74.0001, type: "financial-center", tier: "mega", detail: "GFCI #1 — World's largest financial center" },
  { id: "fc-london", name: "London", shortName: "LON", city: "London", country: "GB", lat: 51.5128, lng: -0.0908, type: "financial-center", tier: "mega", detail: "GFCI #2 — Europe's leading financial hub" },
  { id: "fc-singapore", name: "Singapore", shortName: "SIN", city: "Singapore", country: "SG", lat: 1.2833, lng: 103.8500, type: "financial-center", tier: "mega", detail: "GFCI #3 — Asia's premier financial center" },
  { id: "fc-hongkong", name: "Hong Kong", shortName: "HKG", city: "Hong Kong", country: "HK", lat: 22.2830, lng: 114.1530, type: "financial-center", tier: "mega", detail: "GFCI #4 — China gateway financial hub" },
  { id: "fc-sf", name: "San Francisco", shortName: "SFO", city: "San Francisco", country: "US", lat: 37.7940, lng: -122.3999, type: "financial-center", tier: "mega", detail: "GFCI #5 — Tech-finance nexus" },

  // Regional tier
  { id: "fc-tokyo", name: "Tokyo", shortName: "TYO", city: "Tokyo", country: "JP", lat: 35.6762, lng: 139.6503, type: "financial-center", tier: "major", detail: "Japan's financial center" },
  { id: "fc-shanghai", name: "Shanghai", shortName: "SHA", city: "Shanghai", country: "CN", lat: 31.2304, lng: 121.4737, type: "financial-center", tier: "major", detail: "China's financial hub" },
  { id: "fc-chicago", name: "Chicago", shortName: "CHI", city: "Chicago", country: "US", lat: 41.8825, lng: -87.6328, type: "financial-center", tier: "major", detail: "Derivatives trading capital" },
  { id: "fc-zurich", name: "Zurich", shortName: "ZRH", city: "Zurich", country: "CH", lat: 47.3686, lng: 8.5391, type: "financial-center", tier: "major", detail: "Swiss banking center" },
  { id: "fc-frankfurt", name: "Frankfurt", shortName: "FRA", city: "Frankfurt", country: "DE", lat: 50.1109, lng: 8.6821, type: "financial-center", tier: "major", detail: "European Central Bank seat" },
  { id: "fc-dubai", name: "Dubai / DIFC", shortName: "DXB", city: "Dubai", country: "AE", lat: 25.2134, lng: 55.2825, type: "financial-center", tier: "major", detail: "Middle East financial center" },
  { id: "fc-seoul", name: "Seoul", shortName: "SEL", city: "Seoul", country: "KR", lat: 37.5665, lng: 126.9780, type: "financial-center", tier: "major", detail: "South Korean financial hub" },
  { id: "fc-mumbai", name: "Mumbai", shortName: "BOM", city: "Mumbai", country: "IN", lat: 19.0760, lng: 72.8777, type: "financial-center", tier: "major", detail: "India's financial capital" },
  { id: "fc-toronto", name: "Toronto", shortName: "YTO", city: "Toronto", country: "CA", lat: 43.6532, lng: -79.3832, type: "financial-center", tier: "major", detail: "Canada's financial center" },
  { id: "fc-sydney", name: "Sydney", shortName: "SYD", city: "Sydney", country: "AU", lat: -33.8688, lng: 151.2093, type: "financial-center", tier: "major", detail: "Oceania's financial hub" },

  // Offshore
  { id: "fc-cayman", name: "Cayman Islands", shortName: "KY", city: "George Town", country: "KY", lat: 19.2869, lng: -81.3674, type: "financial-center", tier: "offshore", detail: "Major offshore financial center" },
  { id: "fc-luxembourg", name: "Luxembourg", shortName: "LUX", city: "Luxembourg", country: "LU", lat: 49.6116, lng: 6.1319, type: "financial-center", tier: "offshore", detail: "EU fund domiciliation hub" },
];

// ═══════════════════════════════════════════════════════════════
// CENTRAL BANKS — 14 major central banks & supranational orgs
// ═══════════════════════════════════════════════════════════════
export const CENTRAL_BANKS: FinanceGeoPoint[] = [
  { id: "fed", name: "Federal Reserve", shortName: "Fed", city: "Washington D.C.", country: "US", lat: 38.8928, lng: -77.0455, type: "central-bank", tier: "mega", detail: "US central bank, global reserve currency issuer" },
  { id: "ecb", name: "European Central Bank", shortName: "ECB", city: "Frankfurt", country: "DE", lat: 50.1096, lng: 8.7033, type: "central-bank", tier: "mega", detail: "Eurozone monetary authority" },
  { id: "boj", name: "Bank of Japan", shortName: "BoJ", city: "Tokyo", country: "JP", lat: 35.6867, lng: 139.7635, type: "central-bank", tier: "mega", detail: "Japan's central bank" },
  { id: "boe", name: "Bank of England", shortName: "BoE", city: "London", country: "GB", lat: 51.5142, lng: -0.0882, type: "central-bank", tier: "mega", detail: "UK's central bank" },
  { id: "pboc", name: "People's Bank of China", shortName: "PBoC", city: "Beijing", country: "CN", lat: 39.9064, lng: 116.4038, type: "central-bank", tier: "mega", detail: "China's central bank" },
  { id: "snb", name: "Swiss National Bank", shortName: "SNB", city: "Bern", country: "CH", lat: 46.9482, lng: 7.4476, type: "central-bank", tier: "major", detail: "Switzerland's central bank" },
  { id: "rba", name: "Reserve Bank of Australia", shortName: "RBA", city: "Sydney", country: "AU", lat: -33.8627, lng: 151.2111, type: "central-bank", tier: "major", detail: "Australia's central bank" },
  { id: "boc", name: "Bank of Canada", shortName: "BoC", city: "Ottawa", country: "CA", lat: 45.4230, lng: -75.7010, type: "central-bank", tier: "major", detail: "Canada's central bank" },
  { id: "rbi", name: "Reserve Bank of India", shortName: "RBI", city: "Mumbai", country: "IN", lat: 18.9323, lng: 72.8338, type: "central-bank", tier: "major", detail: "India's central bank" },
  { id: "bok", name: "Bank of Korea", shortName: "BoK", city: "Seoul", country: "KR", lat: 37.5604, lng: 126.9814, type: "central-bank", tier: "major", detail: "South Korea's central bank" },
  { id: "bcb", name: "Banco Central do Brasil", shortName: "BCB", city: "Brasília", country: "BR", lat: -15.7839, lng: -47.8829, type: "central-bank", tier: "regional", detail: "Brazil's central bank" },
  { id: "sama", name: "Saudi Central Bank", shortName: "SAMA", city: "Riyadh", country: "SA", lat: 24.6938, lng: 46.6850, type: "central-bank", tier: "regional", detail: "Saudi Arabia's central bank" },
  { id: "bis", name: "Bank for International Settlements", shortName: "BIS", city: "Basel", country: "CH", lat: 47.5585, lng: 7.5866, type: "central-bank", tier: "mega", detail: "Central bank of central banks" },
  { id: "imf", name: "International Monetary Fund", shortName: "IMF", city: "Washington D.C.", country: "US", lat: 38.8987, lng: -77.0425, type: "central-bank", tier: "mega", detail: "Global financial stability institution" },
];

// ═══════════════════════════════════════════════════════════════
// COMMODITY HUBS — exchanges, ports, and energy corridors
// ═══════════════════════════════════════════════════════════════
export const COMMODITY_HUBS: FinanceGeoPoint[] = [
  { id: "cme", name: "CME Group (CBOT/NYMEX/COMEX)", shortName: "CME", city: "Chicago", country: "US", lat: 41.8822, lng: -87.6324, type: "commodity-hub", tier: "mega", detail: "World's largest derivatives exchange" },
  { id: "ice", name: "ICE (Intercontinental Exchange)", shortName: "ICE", city: "Atlanta", country: "US", lat: 33.7628, lng: -84.3874, type: "commodity-hub", tier: "mega", detail: "Global commodity and financial exchange" },
  { id: "lme", name: "London Metal Exchange", shortName: "LME", city: "London", country: "GB", lat: 51.5128, lng: -0.0802, type: "commodity-hub", tier: "mega", detail: "World's center for metals trading" },
  { id: "shfe", name: "Shanghai Futures Exchange", shortName: "SHFE", city: "Shanghai", country: "CN", lat: 31.2358, lng: 121.4842, type: "commodity-hub", tier: "major", detail: "China's major commodity exchange" },
  { id: "dce", name: "Dalian Commodity Exchange", shortName: "DCE", city: "Dalian", country: "CN", lat: 38.9140, lng: 121.6147, type: "commodity-hub", tier: "major", detail: "Key agricultural & metals exchange" },
  { id: "dgcx", name: "Dubai Gold & Commodities Exchange", shortName: "DGCX", city: "Dubai", country: "AE", lat: 25.2214, lng: 55.2728, type: "commodity-hub", tier: "regional", detail: "Middle East commodity exchange" },
  { id: "mcx", name: "Multi Commodity Exchange", shortName: "MCX", city: "Mumbai", country: "IN", lat: 19.0536, lng: 72.8582, type: "commodity-hub", tier: "regional", detail: "India's largest commodity exchange" },
  { id: "rotterdam", name: "Port of Rotterdam", shortName: "Rotterdam", city: "Rotterdam", country: "NL", lat: 51.9025, lng: 4.4717, type: "commodity-hub", tier: "major", detail: "Europe's largest port, key energy hub" },
  { id: "houston", name: "Houston Energy Corridor", shortName: "Houston", city: "Houston", country: "US", lat: 29.7765, lng: -95.4469, type: "commodity-hub", tier: "major", detail: "World's energy capital" },
];

// ═══════════════════════════════════════════════════════════════
// COMBINED — all finance geo points for map rendering
// ═══════════════════════════════════════════════════════════════
export const ALL_FINANCE_GEO: FinanceGeoPoint[] = [
  ...STOCK_EXCHANGES,
  ...FINANCIAL_CENTERS,
  ...CENTRAL_BANKS,
  ...COMMODITY_HUBS,
];

/** Finance geo type → marker color */
export const FINANCE_GEO_COLORS: Record<FinanceGeoPoint["type"], string> = {
  "exchange": "#ffd000",
  "financial-center": "#00e5ff",
  "central-bank": "#ff4757",
  "commodity-hub": "#00ff88",
};

/** Finance geo type → marker icon */
export const FINANCE_GEO_ICONS: Record<FinanceGeoPoint["type"], string> = {
  "exchange": "📈",
  "financial-center": "🏦",
  "central-bank": "🏛️",
  "commodity-hub": "⛽",
};

/** Finance geo tier → marker size */
export const FINANCE_GEO_SIZES: Record<FinanceGeoPoint["tier"], number> = {
  mega: 14,
  major: 10,
  regional: 7,
  offshore: 6,
};
