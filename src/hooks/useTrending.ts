"use client";

import useSWR from "swr";
import type { IntelItem } from "@/types/intel";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface IntelResponse {
  items: IntelItem[];
  total: number;
}

interface ViewerResponse {
  viewers: number;
}

/**
 * Fetches trending events (sorted by recency + severity) and viewer count.
 * SWR with 30-second auto-refresh.
 */
export function useTrending() {
  const {
    data: intelData,
    isLoading: intelLoading,
  } = useSWR<IntelResponse>("/api/intel?limit=20", fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: false,
    dedupingInterval: 15_000,
  });

  const {
    data: viewerData,
    isLoading: viewerLoading,
  } = useSWR<ViewerResponse>("/api/realtime/viewers", fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: false,
    dedupingInterval: 15_000,
  });

  // Items are already sorted by the intel API (recency + severity).
  // Take the top items as "trending".
  const trendingItems = intelData?.items ?? [];
  const viewerCount = viewerData?.viewers ?? 0;

  return {
    trendingItems,
    viewerCount,
    isLoading: intelLoading || viewerLoading,
  };
}
