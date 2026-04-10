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
    `/api/intel?lang=${locale}&limit=50`,
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  );

  // Merge realtime events into SWR cache without refetching
  const handleRealtimeEvent = useCallback(
    (newItem: IntelItem) => {
      mutate(
        (current) => {
          if (!current) return current;
          // Skip if already exists (by URL or normalized title)
          const normalizedTitle = newItem.title
            .toLowerCase()
            .replace(/^(breaking|update|just in|exclusive)[:\s-]*/i, "")
            .replace(/[^\w\s]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 80);
          const exists = current.items.some((i) => {
            if (newItem.url && i.url && i.url.split("?")[0] === newItem.url.split("?")[0]) return true;
            const iNorm = i.title
              .toLowerCase()
              .replace(/^(breaking|update|just in|exclusive)[:\s-]*/i, "")
              .replace(/[^\w\s]/g, "")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 80);
            return iNorm === normalizedTitle;
          });
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
            items: updated.slice(0, 200),
            total: Math.min(updated.length, 200),
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
