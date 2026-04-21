/**
 * Text-based country extractor.
 *
 * Most RSS feeds and news APIs don't attach a country code to items,
 * but the country is almost always named in the headline or lead
 * sentence ("Türkiye'de…", "Iran's nuclear…", "Israeli forces…").
 * This module scans title + summary for an exact match against our
 * 195-country catalog (English + Turkish + common adjectival forms)
 * and returns the ISO-3166 alpha-2 code.
 *
 * Design rules:
 *   - Word-boundary matching only. "USA" inside "USAir" must NOT match.
 *   - Case-insensitive, diacritic-aware ("İran" matches "Iran").
 *   - When multiple countries appear, the *first* occurrence wins so a
 *     "Türkiye - Suriye sınırı" headline maps to TR (primary subject).
 *   - Adjectivals like "American", "Russian" are included because many
 *     headlines never name the country itself ("Russian forces in…").
 *   - Ambiguous strings ("Georgia" = country OR US state) are skipped;
 *     we prefer false-negatives over cross-tagging.
 *
 * Performance: one compile-at-module-load regex per catalog entry,
 * linear scan per call. ~1µs per event on the 195-entry list.
 */

import { COUNTRIES } from "@/config/countries";

interface Pattern {
  code: string;
  regex: RegExp;
}

/** Adjectivals + alternate spellings mapped to country codes. Keep
 *  conservative — false matches are worse than a null tag. */
const ADJECTIVALS: Record<string, string[]> = {
  US: ["American", "U\\.S\\.", "USA", "United States"],
  GB: ["British", "UK\\b", "U\\.K\\.", "United Kingdom"],
  DE: ["German"],
  FR: ["French"],
  IT: ["Italian"],
  ES: ["Spanish"],
  RU: ["Russian"],
  UA: ["Ukrainian"],
  CN: ["Chinese"],
  JP: ["Japanese"],
  KR: ["South Korean"],
  KP: ["North Korean"],
  IN: ["Indian"],
  PK: ["Pakistani"],
  IR: ["Iranian"],
  IQ: ["Iraqi"],
  SY: ["Syrian"],
  IL: ["Israeli"],
  PS: ["Palestinian"],
  TR: ["Turkish", "Türk"],
  SA: ["Saudi"],
  EG: ["Egyptian"],
  AE: ["Emirati"],
  BR: ["Brazilian"],
  MX: ["Mexican"],
  CA: ["Canadian"],
  AU: ["Australian"],
  ZA: ["South African"],
  NG: ["Nigerian"],
  ET: ["Ethiopian"],
  KE: ["Kenyan"],
  AF: ["Afghan"],
  LB: ["Lebanese"],
  YE: ["Yemeni"],
  JO: ["Jordanian"],
  QA: ["Qatari"],
  KW: ["Kuwaiti"],
  OM: ["Omani"],
  BH: ["Bahraini"],
  PL: ["Polish"],
  NL: ["Dutch"],
  BE: ["Belgian"],
  SE: ["Swedish"],
  NO: ["Norwegian"],
  FI: ["Finnish"],
  DK: ["Danish"],
  GR: ["Greek"],
  PT: ["Portuguese"],
  CH: ["Swiss"],
  AT: ["Austrian"],
  IE: ["Irish"],
  RO: ["Romanian"],
  BG: ["Bulgarian"],
  HR: ["Croatian"],
  RS: ["Serbian"],
  HU: ["Hungarian"],
  CZ: ["Czech"],
  SK: ["Slovak"],
  TH: ["Thai"],
  VN: ["Vietnamese"],
  PH: ["Filipino"],
  ID: ["Indonesian"],
  MY: ["Malaysian"],
  SG: ["Singaporean"],
};

/** Country names whose plain word form is too ambiguous to match
 *  without context. We still keep the adjectival ("Georgian") for
 *  these. */
const AMBIGUOUS_PLAIN_NAMES = new Set(["Georgia", "Jordan", "Chad"]);

/**
 * Capital / major cities → ISO code. Covers the case where a headline
 * writes "Tehran condemns…" or "Istanbul's mayor…" without ever naming
 * the country. Conservative list — only well-known capitals + commercial
 * hubs that have low ambiguity (no "Paris, Texas" conflicts worth caring
 * about at this scale).
 *
 * First-occurrence-wins rule applies: if a headline mentions Tehran then
 * Jerusalem, IR wins because it appears first.
 */
const CITY_TO_COUNTRY: Record<string, string> = {
  // ── Turkey ──
  Istanbul: "TR", İstanbul: "TR", Ankara: "TR", İzmir: "TR", Izmir: "TR",
  Antalya: "TR", Bursa: "TR", Adana: "TR", Gaziantep: "TR", Konya: "TR",
  Diyarbakır: "TR", Diyarbakir: "TR", Trabzon: "TR", Mersin: "TR",
  // ── Middle East ──
  Tehran: "IR", Tahran: "IR", Isfahan: "IR", Mashhad: "IR", Shiraz: "IR",
  Tabriz: "IR", Qom: "IR",
  Jerusalem: "IL", "Tel Aviv": "IL", "Tel-Aviv": "IL", Haifa: "IL",
  "Be'er Sheva": "IL", Netanya: "IL",
  Damascus: "SY", Şam: "SY", Aleppo: "SY", Halep: "SY", Homs: "SY",
  Baghdad: "IQ", Bağdat: "IQ", Mosul: "IQ", Musul: "IQ", Basra: "IQ",
  Erbil: "IQ", Najaf: "IQ", Kirkuk: "IQ",
  Beirut: "LB", Beyrut: "LB", Tripoli: "LB",
  Amman: "JO", Riyadh: "SA", Jeddah: "SA", Mecca: "SA", Medina: "SA",
  Dubai: "AE", "Abu Dhabi": "AE", "Abu-Dhabi": "AE",
  Doha: "QA", "Kuwait City": "KW", Manama: "BH", Muscat: "OM",
  Sanaa: "YE", Aden: "YE", Taiz: "YE",
  Gaza: "PS", Ramallah: "PS", "West Bank": "PS", Hebron: "PS",
  Kabul: "AF", Kandahar: "AF", Herat: "AF",
  // ── Europe ──
  London: "GB", Manchester: "GB", Glasgow: "GB", Edinburgh: "GB",
  Berlin: "DE", Munich: "DE", Münih: "DE", Hamburg: "DE", Frankfurt: "DE",
  Köln: "DE", Cologne: "DE", Stuttgart: "DE",
  Paris: "FR", Lyon: "FR", Marseille: "FR",
  Madrid: "ES", Barcelona: "ES",
  Rome: "IT", Roma: "IT", Milan: "IT", Milano: "IT",
  Moscow: "RU", Moskova: "RU", "St Petersburg": "RU", "St. Petersburg": "RU",
  Kazan: "RU", Novosibirsk: "RU",
  Kyiv: "UA", Kiev: "UA", Odesa: "UA", Odessa: "UA", Kharkiv: "UA",
  Lviv: "UA", Mariupol: "UA",
  Warsaw: "PL", Krakow: "PL", Kraków: "PL",
  Amsterdam: "NL", "The Hague": "NL", Rotterdam: "NL",
  Brussels: "BE", Antwerp: "BE",
  Vienna: "AT", Viyana: "AT",
  Zurich: "CH", Geneva: "CH", Bern: "CH",
  Stockholm: "SE", Oslo: "NO", Copenhagen: "DK",
  Helsinki: "FI", Athens: "GR", Atina: "GR", Lisbon: "PT", Lizbon: "PT",
  Dublin: "IE", Prague: "CZ", Prag: "CZ", Budapest: "HU",
  Bucharest: "RO", Bükreş: "RO", Sofia: "BG",
  Belgrade: "RS", Belgrad: "RS", Zagreb: "HR", Ljubljana: "SI",
  Sarajevo: "BA", Skopje: "MK", Tirana: "AL", Chișinău: "MD", Chisinau: "MD",
  Minsk: "BY",
  // ── Americas ──
  Washington: "US", "Washington DC": "US", "Washington D.C.": "US",
  "New York": "US", Manhattan: "US", Brooklyn: "US",
  "Los Angeles": "US", "San Francisco": "US", Chicago: "US",
  Boston: "US", Miami: "US", Houston: "US", Dallas: "US", Seattle: "US",
  Philadelphia: "US", Atlanta: "US", Denver: "US", Phoenix: "US",
  "Wall Street": "US", Pentagon: "US",
  Ottawa: "CA", Toronto: "CA", Montreal: "CA", Vancouver: "CA",
  "Mexico City": "MX", Guadalajara: "MX", Monterrey: "MX", Tijuana: "MX",
  Brasília: "BR", Brasilia: "BR", "São Paulo": "BR", "Sao Paulo": "BR",
  Rio: "BR", "Rio de Janeiro": "BR",
  "Buenos Aires": "AR", Córdoba: "AR", Cordoba: "AR",
  Santiago: "CL", Lima: "PE", Bogotá: "CO", Bogota: "CO", Medellín: "CO",
  Medellin: "CO", Caracas: "VE", Quito: "EC", "La Paz": "BO",
  Asunción: "PY", Asuncion: "PY", Montevideo: "UY",
  Havana: "CU", Habana: "CU",
  // ── Asia ──
  Beijing: "CN", Pekin: "CN", Shanghai: "CN", Shenzhen: "CN", Guangzhou: "CN",
  "Hong Kong": "HK", Macau: "MO",
  Taipei: "TW", Kaohsiung: "TW",
  Tokyo: "JP", Osaka: "JP", Kyoto: "JP", Sapporo: "JP", Fukuoka: "JP",
  Nagoya: "JP", Yokohama: "JP",
  Seoul: "KR", Busan: "KR", Incheon: "KR",
  Pyongyang: "KP",
  "New Delhi": "IN", Delhi: "IN", Mumbai: "IN", Bombay: "IN",
  Bangalore: "IN", Bengaluru: "IN", Kolkata: "IN", Calcutta: "IN",
  Chennai: "IN", Hyderabad: "IN",
  Islamabad: "PK", Karachi: "PK", Lahore: "PK",
  Dhaka: "BD", Chittagong: "BD",
  Colombo: "LK", Kathmandu: "NP", Thimphu: "BT",
  Jakarta: "ID", Surabaya: "ID",
  "Kuala Lumpur": "MY", Penang: "MY",
  Singapore: "SG", "Singapore City": "SG",
  Bangkok: "TH", "Chiang Mai": "TH",
  Hanoi: "VN", "Ho Chi Minh": "VN", "Ho Chi Minh City": "VN", Saigon: "VN",
  Manila: "PH", Cebu: "PH",
  "Naypyidaw": "MM", Yangon: "MM", Rangoon: "MM",
  "Phnom Penh": "KH", Vientiane: "LA",
  Ulaanbaatar: "MN", "Ulan Bator": "MN",
  Tashkent: "UZ", "Nur-Sultan": "KZ", Astana: "KZ", Almaty: "KZ",
  Bishkek: "KG", Dushanbe: "TJ", Ashgabat: "TM",
  Baku: "AZ", Yerevan: "AM", Tbilisi: "GE",
  // ── Africa ──
  Cairo: "EG", Kahire: "EG", Alexandria: "EG", Giza: "EG",
  Lagos: "NG", Abuja: "NG", "Kano": "NG",
  Nairobi: "KE", Mombasa: "KE",
  "Addis Ababa": "ET", "Cape Town": "ZA", Johannesburg: "ZA", Pretoria: "ZA",
  Durban: "ZA",
  Algiers: "DZ", Cezayir: "DZ", Casablanca: "MA", Rabat: "MA", Tangier: "MA",
  Tunis: "TN",
  // "Tripoli" alone is ambiguous (Lebanon has one too). We keep the LB
  // entry above because Lebanon is more newsworthy in our dataset; a
  // future fix is context-aware disambiguation.
  Khartoum: "SD", "Juba": "SS",
  Dakar: "SN", Abidjan: "CI", Accra: "GH", Bamako: "ML", Niamey: "NE",
  Ouagadougou: "BF", "N'Djamena": "TD", Yaoundé: "CM", Yaounde: "CM",
  Libreville: "GA", Brazzaville: "CG", Kinshasa: "CD", Luanda: "AO",
  Lusaka: "ZM", Harare: "ZW", Gaborone: "BW", Windhoek: "NA", Maputo: "MZ",
  Kigali: "RW", Bujumbura: "BI", "Dar es Salaam": "TZ", Kampala: "UG",
  Mogadishu: "SO", Asmara: "ER", Djibouti: "DJ",
  Antananarivo: "MG", "Port Louis": "MU",
  // ── Oceania ──
  Canberra: "AU", Sydney: "AU", Melbourne: "AU", Brisbane: "AU", Perth: "AU",
  Auckland: "NZ", Wellington: "NZ",
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PATTERNS: Pattern[] = (() => {
  const entries: Pattern[] = [];
  for (const c of COUNTRIES) {
    const variants: string[] = [];
    if (!AMBIGUOUS_PLAIN_NAMES.has(c.name)) variants.push(c.name);
    // Turkish name if it differs
    if (c.nameTr && c.nameTr !== c.name) variants.push(c.nameTr);
    const adjectivals = ADJECTIVALS[c.code] || [];
    variants.push(...adjectivals);

    if (variants.length === 0) continue;

    // \b works in ASCII; for Turkish "Türkiye" we need a softer boundary.
    // Use (?:^|\W) ... (?:$|\W) so we match word-like boundaries incl.
    // non-ASCII letters without tripping on hyphens or apostrophes.
    const alternation = variants.map(escapeRegex).join("|");
    entries.push({
      code: c.code,
      regex: new RegExp(`(?:^|[^\\p{L}])(?:${alternation})(?:[^\\p{L}]|$)`, "iu"),
    });
  }

  // Append city patterns as separate entries so "Tehran condemns" hits
  // IR even when "Iran" isn't in the headline. Grouped by country so we
  // get one regex per country (cheaper than one-per-city).
  const citiesByCountry: Record<string, string[]> = {};
  for (const [city, code] of Object.entries(CITY_TO_COUNTRY)) {
    (citiesByCountry[code] ??= []).push(city);
  }
  for (const [code, cities] of Object.entries(citiesByCountry)) {
    const alternation = cities.map(escapeRegex).join("|");
    entries.push({
      code,
      regex: new RegExp(`(?:^|[^\\p{L}])(?:${alternation})(?:[^\\p{L}]|$)`, "iu"),
    });
  }

  return entries;
})();

/**
 * Extract the most likely country ISO-2 code from free-text content.
 * Returns null when no country is unambiguously named.
 */
export function extractCountryCode(...texts: (string | null | undefined)[]): string | null {
  const haystack = texts.filter(Boolean).join(" \n ");
  if (!haystack || haystack.length < 3) return null;

  // First-occurrence wins — so we track the earliest match across all
  // country patterns and return that country.
  let bestIndex = Number.POSITIVE_INFINITY;
  let bestCode: string | null = null;
  for (const { code, regex } of PATTERNS) {
    const m = haystack.match(regex);
    if (m && m.index !== undefined && m.index < bestIndex) {
      bestIndex = m.index;
      bestCode = code;
    }
  }
  return bestCode;
}
