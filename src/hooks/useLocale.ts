import { useLocale as useNextIntlLocale } from "next-intl";
import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";

/**
 * Hook to get current locale and switch locale via cookie.
 * Triggers a router refresh to re-render with new messages.
 */
export function useLocaleSwitcher() {
  const locale = useNextIntlLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchLocale = useCallback(
    async (newLocale: Locale) => {
      if (newLocale === locale) return;

      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: newLocale }),
      });

      startTransition(() => {
        router.refresh();
      });
    },
    [locale, router]
  );

  return { locale, switchLocale, isPending };
}
