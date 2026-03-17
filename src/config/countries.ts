/** Country metadata for SEO pages and geo-filtering */
export interface CountryMeta {
  code: string;       // ISO 3166-1 alpha-2
  name: string;
  nameTr: string;     // Turkish name
  lat: number;
  lng: number;
  zoom: number;       // Default map zoom for this country
  region: string;     // Broad region for grouping
}

export const COUNTRIES: CountryMeta[] = [
  // ── Middle East ──
  { code: "TR", name: "Turkey", nameTr: "Türkiye", lat: 39.0, lng: 35.0, zoom: 5.5, region: "Middle East" },
  { code: "IL", name: "Israel", nameTr: "İsrail", lat: 31.5, lng: 34.8, zoom: 7, region: "Middle East" },
  { code: "IR", name: "Iran", nameTr: "İran", lat: 32.4, lng: 53.7, zoom: 5, region: "Middle East" },
  { code: "IQ", name: "Iraq", nameTr: "Irak", lat: 33.2, lng: 43.7, zoom: 5.5, region: "Middle East" },
  { code: "SY", name: "Syria", nameTr: "Suriye", lat: 35.0, lng: 38.0, zoom: 6, region: "Middle East" },
  { code: "SA", name: "Saudi Arabia", nameTr: "Suudi Arabistan", lat: 23.9, lng: 45.1, zoom: 5, region: "Middle East" },
  { code: "AE", name: "UAE", nameTr: "BAE", lat: 23.4, lng: 53.8, zoom: 6, region: "Middle East" },
  { code: "YE", name: "Yemen", nameTr: "Yemen", lat: 15.6, lng: 48.5, zoom: 5.5, region: "Middle East" },
  { code: "LB", name: "Lebanon", nameTr: "Lübnan", lat: 33.9, lng: 35.9, zoom: 8, region: "Middle East" },

  // ── Europe ──
  { code: "UA", name: "Ukraine", nameTr: "Ukrayna", lat: 48.4, lng: 31.2, zoom: 5, region: "Europe" },
  { code: "RU", name: "Russia", nameTr: "Rusya", lat: 61.5, lng: 105.3, zoom: 3, region: "Europe" },
  { code: "DE", name: "Germany", nameTr: "Almanya", lat: 51.2, lng: 10.5, zoom: 5.5, region: "Europe" },
  { code: "FR", name: "France", nameTr: "Fransa", lat: 46.6, lng: 1.9, zoom: 5.5, region: "Europe" },
  { code: "GB", name: "United Kingdom", nameTr: "Birleşik Krallık", lat: 55.4, lng: -3.4, zoom: 5, region: "Europe" },
  { code: "PL", name: "Poland", nameTr: "Polonya", lat: 51.9, lng: 19.1, zoom: 5.5, region: "Europe" },
  { code: "IT", name: "Italy", nameTr: "İtalya", lat: 41.9, lng: 12.6, zoom: 5.5, region: "Europe" },

  // ── Asia ──
  { code: "CN", name: "China", nameTr: "Çin", lat: 35.9, lng: 104.2, zoom: 3.5, region: "Asia" },
  { code: "JP", name: "Japan", nameTr: "Japonya", lat: 36.2, lng: 138.3, zoom: 5, region: "Asia" },
  { code: "KR", name: "South Korea", nameTr: "Güney Kore", lat: 35.9, lng: 127.8, zoom: 6, region: "Asia" },
  { code: "KP", name: "North Korea", nameTr: "Kuzey Kore", lat: 40.3, lng: 127.5, zoom: 6, region: "Asia" },
  { code: "IN", name: "India", nameTr: "Hindistan", lat: 20.6, lng: 79.0, zoom: 4.5, region: "Asia" },
  { code: "PK", name: "Pakistan", nameTr: "Pakistan", lat: 30.4, lng: 69.3, zoom: 5, region: "Asia" },
  { code: "TW", name: "Taiwan", nameTr: "Tayvan", lat: 23.7, lng: 121.0, zoom: 7, region: "Asia" },
  { code: "AF", name: "Afghanistan", nameTr: "Afganistan", lat: 33.9, lng: 67.7, zoom: 5.5, region: "Asia" },
  { code: "MM", name: "Myanmar", nameTr: "Myanmar", lat: 21.9, lng: 95.9, zoom: 5.5, region: "Asia" },

  // ── Americas ──
  { code: "US", name: "United States", nameTr: "ABD", lat: 37.1, lng: -95.7, zoom: 3.5, region: "Americas" },
  { code: "BR", name: "Brazil", nameTr: "Brezilya", lat: -14.2, lng: -51.9, zoom: 3.5, region: "Americas" },
  { code: "MX", name: "Mexico", nameTr: "Meksika", lat: 23.6, lng: -102.6, zoom: 4.5, region: "Americas" },
  { code: "CO", name: "Colombia", nameTr: "Kolombiya", lat: 4.6, lng: -74.3, zoom: 5, region: "Americas" },
  { code: "VE", name: "Venezuela", nameTr: "Venezuela", lat: 6.4, lng: -66.6, zoom: 5.5, region: "Americas" },

  // ── Africa ──
  { code: "NG", name: "Nigeria", nameTr: "Nijerya", lat: 9.1, lng: 8.7, zoom: 5.5, region: "Africa" },
  { code: "EG", name: "Egypt", nameTr: "Mısır", lat: 26.8, lng: 30.8, zoom: 5.5, region: "Africa" },
  { code: "SD", name: "Sudan", nameTr: "Sudan", lat: 12.9, lng: 30.2, zoom: 5, region: "Africa" },
  { code: "ET", name: "Ethiopia", nameTr: "Etiyopya", lat: 9.1, lng: 40.5, zoom: 5.5, region: "Africa" },
  { code: "SO", name: "Somalia", nameTr: "Somali", lat: 5.2, lng: 46.2, zoom: 5.5, region: "Africa" },
  { code: "CD", name: "DR Congo", nameTr: "DR Kongo", lat: -4.0, lng: 21.8, zoom: 5, region: "Africa" },
  { code: "ZA", name: "South Africa", nameTr: "Güney Afrika", lat: -30.6, lng: 22.9, zoom: 5, region: "Africa" },
];

/** Quick lookup by country code */
export const COUNTRY_MAP = new Map(COUNTRIES.map((c) => [c.code, c]));

/** All unique regions */
export const REGIONS = [...new Set(COUNTRIES.map((c) => c.region))];
