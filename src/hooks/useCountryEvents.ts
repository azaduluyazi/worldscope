"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { useLocale } from "next-intl";
import type { IntelFeedResponse, IntelItem } from "@/types/intel";
import { SEVERITY_ORDER } from "@/types/intel";
import { useRealtimeEvents } from "./useRealtimeEvents";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UseCountryEventsOptions {
  countryCode: string;
  categories?: Set<string>;
  severities?: Set<string>;
}

export function useCountryEvents({ countryCode, categories, severities }: UseCountryEventsOptions) {
  const locale = useLocale();
  const { data, error, isLoading, mutate } = useSWR<IntelFeedResponse>(
    `/api/intel?country=${countryCode.toUpperCase()}&lang=${locale}`,
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
      dedupingInterval: 30_000,
    }
  );

  // Merge realtime events matching this country
  const handleRealtimeEvent = useCallback(
    (newItem: IntelItem) => {
      if (newItem.countryCode?.toUpperCase() !== countryCode.toUpperCase()) return;

      mutate(
        (current) => {
          if (!current) return current;
          const key = newItem.title.toLowerCase().slice(0, 60);
          const exists = current.items.some(
            (i) => i.title.toLowerCase().slice(0, 60) === key
          );
          if (exists) return current;

          const updated = [newItem, ...current.items];
          updated.sort((a, b) => {
            const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
            if (sevDiff !== 0) return sevDiff;
            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
          });

          return {
            ...current,
            items: updated.slice(0, 200),
            total: Math.min(updated.length, 200),
          };
        },
        { revalidate: false }
      );
    },
    [mutate, countryCode]
  );

  useRealtimeEvents(handleRealtimeEvent);

  // Apply client-side filters
  const filteredItems = useMemo(() => {
    let items = data?.items || [];
    if (categories && categories.size > 0) {
      items = items.filter((i) => categories.has(i.category));
    }
    if (severities && severities.size > 0) {
      items = items.filter((i) => severities.has(i.severity));
    }
    return items;
  }, [data?.items, categories, severities]);

  return {
    items: filteredItems,
    allItems: data?.items || [],
    total: data?.total || 0,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
