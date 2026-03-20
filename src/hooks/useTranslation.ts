import { useState, useEffect, useCallback, useRef } from "react";
import { useLocale } from "next-intl";

/**
 * Hook for translating news headlines to the user's selected locale.
 * Batches translations and caches results in-memory.
 */

const translationCache = new Map<string, string>();

export function useHeadlineTranslation() {
  const locale = useLocale();
  const [isTranslating, setIsTranslating] = useState(false);
  const pendingRef = useRef<Map<string, (val: string) => void>>(new Map());
  const batchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Flush pending translations as a batch
  const flushBatch = useCallback(async () => {
    const pending = new Map(pendingRef.current);
    pendingRef.current.clear();
    if (pending.size === 0) return;

    const texts = Array.from(pending.keys());
    setIsTranslating(true);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: texts, target: locale, source: "en" }),
      });

      if (res.ok) {
        const { translations } = await res.json();
        texts.forEach((text, i) => {
          const translated = translations[i] || text;
          const cacheKey = `${locale}:${text}`;
          translationCache.set(cacheKey, translated);
          pending.get(text)?.(translated);
        });
      } else {
        // On error, resolve with original text
        texts.forEach((text) => pending.get(text)?.(text));
      }
    } catch {
      texts.forEach((text) => pending.get(text)?.(text));
    } finally {
      setIsTranslating(false);
    }
  }, [locale]);

  // Request translation for a single text (batched)
  const translate = useCallback(
    (text: string): Promise<string> => {
      // Skip if already in English or locale is English
      if (locale === "en" || !text.trim()) return Promise.resolve(text);

      // Check cache first
      const cacheKey = `${locale}:${text}`;
      const cached = translationCache.get(cacheKey);
      if (cached) return Promise.resolve(cached);

      // Add to pending batch
      return new Promise<string>((resolve) => {
        pendingRef.current.set(text, resolve);

        // Debounce: flush after 100ms of no new requests
        if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
        batchTimerRef.current = setTimeout(flushBatch, 100);
      });
    },
    [locale, flushBatch]
  );

  // Clear cache when locale changes
  useEffect(() => {
    // Keep cache across locale changes (different keys per locale)
  }, [locale]);

  return { translate, isTranslating, locale };
}
