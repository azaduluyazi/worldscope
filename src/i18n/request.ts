import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, type Locale, locales } from "./config";

/**
 * Server-side message provider for next-intl (without i18n routing).
 * Reads locale from NEXT_LOCALE cookie, falls back to defaultLocale.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get("NEXT_LOCALE")?.value;
  const locale: Locale = locales.includes(raw as Locale)
    ? (raw as Locale)
    : defaultLocale;

  const messages = (await import(`./${locale}.json`)).default;

  return { locale, messages };
});
