import useSWR from "swr";
import type { IntelFeedResponse } from "@/types/intel";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useIntelFeed() {
  const { data, error, isLoading, mutate } = useSWR<IntelFeedResponse>(
    "/api/intel",
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
      dedupingInterval: 30_000,
    }
  );

  return {
    items: data?.items || [],
    total: data?.total || 0,
    lastUpdated: data?.lastUpdated,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
