import useSWR from "swr";
import type { IntelItem } from "@/types/intel";

interface SportsResponse {
  items: IntelItem[];
  total: number;
  lastUpdated: string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useSportsData() {
  const { data, error, isLoading, mutate } = useSWR<SportsResponse>(
    "/api/sports",
    fetcher,
    {
      refreshInterval: 120_000,
      revalidateOnFocus: true,
      dedupingInterval: 60_000,
    }
  );

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    lastUpdated: data?.lastUpdated,
    error,
    isLoading,
    refresh: mutate,
  };
}
