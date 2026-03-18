export const locales = ["en", "tr", "ar", "de", "es", "fr", "ja", "ko", "ru", "zh"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const RTL_LOCALES: readonly Locale[] = ["ar"];

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
};
