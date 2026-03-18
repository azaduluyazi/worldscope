import { useCallback } from "react";
import useSWR from "swr";
import { useLocale } from "next-intl";
import type { IntelFeedResponse, IntelItem } from "@/types/intel";
import { SEVERITY_ORDER } from "@/types/intel";
import { useRealtimeEvents } from "./useRealtimeEvents";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useIntelFeed() {
  const locale = useLocale();
  const { data, error, isLoading, mutate } = useSWR<IntelFeedResponse>(
    `/api/intel?lang=${locale}`,
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
      dedupingInterval: 30_000,
    }
  );

  // Merge realtime events into SWR cache without refetching
  const handleRealtimeEvent = useCallback(
    (newItem: IntelItem) => {
      mutate(
        (current) => {
          if (!current) return current;
          // Skip if already exists (by title similarity)
          const key = newItem.title.toLowerCase().slice(0, 60);
          const exists = current.items.some(
            (i) => i.title.toLowerCase().slice(0, 60) === key
          );
          if (exists) return current;

          // Insert in sorted position (severity then recency)
          const updated = [newItem, ...current.items];
          updated.sort((a, b) => {
            const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
            if (sevDiff !== 0) return sevDiff;
            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
          });

          return {
            ...current,
            items: updated.slice(0, 500),
            total: Math.min(updated.length, 500),
          };
        },
        { revalidate: false }
      );
    },
    [mutate]
  );

  // Subscribe to Supabase Realtime
  useRealtimeEvents(handleRealtimeEvent);

  return {
    items: data?.items || [],
    total: data?.total || 0,
    lastUpdated: data?.lastUpdated,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
