export const locales = [
  "en", "tr", "ar", "de", "es", "fr", "ja", "ko", "ru", "zh",
  "pt", "it", "nl", "pl", "uk", "cs", "sv", "da", "fi", "no",
  "el", "hu", "ro", "hi", "bn", "th", "vi", "id", "ms", "fa",
] as const;

export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const RTL_LOCALES: readonly Locale[] = ["ar", "fa"];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
  ar: "العربية",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
  ja: "日本語",
  ko: "한국어",
  ru: "Русский",
  zh: "中文",
  pt: "Português",
  it: "Italiano",
  nl: "Nederlands",
  pl: "Polski",
  uk: "Українська",
  cs: "Čeština",
  sv: "Svenska",
  da: "Dansk",
  fi: "Suomi",
  no: "Norsk",
  el: "Ελληνικά",
  hu: "Magyar",
  ro: "Română",
  hi: "हिन्दी",
  bn: "বাংলা",
  th: "ไทย",
  vi: "Tiếng Việt",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  fa: "فارسی",
};

/** Map browser language codes to our supported locales */
export function detectLocale(browserLang: string): Locale {
  // Exact match first (e.g., "tr" -> "tr")
  const base = browserLang.split("-")[0].toLowerCase();
  if (locales.includes(base as Locale)) return base as Locale;

  // Special mappings
  const MAPPINGS: Record<string, Locale> = {
    "zh-tw": "zh",
    "zh-cn": "zh",
    "pt-br": "pt",
    "nb": "no", // Norwegian Bokmål -> no
    "nn": "no", // Norwegian Nynorsk -> no
  };

  const full = browserLang.toLowerCase();
  if (MAPPINGS[full]) return MAPPINGS[full];

  return defaultLocale;
}
