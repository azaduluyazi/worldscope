import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { defaultLocale, detectLocale, type Locale, locales } from "./config";

/**
 * Server-side message provider for next-intl (without i18n routing).
 *
 * Priority order:
 * 1. NEXT_LOCALE cookie (user explicitly chose a language)
 * 2. Accept-Language header (browser/system language auto-detection)
 * 3. Default locale (English)
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  // 1. Check cookie first (explicit user choice)
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    const locale = cookieLocale as Locale;
    const messages = (await import(`./${locale}.json`)).default;
    return { locale, messages };
  }

  // 2. Auto-detect from Accept-Language header
  const acceptLang = headerStore.get("accept-language") || "";
  // Parse "en-US,en;q=0.9,tr;q=0.8" → take the first preferred language
  const preferred = acceptLang.split(",")[0]?.trim().split(";")[0] || "";
  const detected = preferred ? detectLocale(preferred) : defaultLocale;

  const messages = (await import(`./${detected}.json`)).default;
  return { locale: detected, messages };
});
