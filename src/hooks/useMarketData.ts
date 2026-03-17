import useSWR from "swr";
import type { MarketDataResponse } from "@/types/market";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useMarketData() {
  const { data, error, isLoading } = useSWR<MarketDataResponse>(
    "/api/market",
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
    }
  );

  return {
    quotes: data?.quotes || [],
    lastUpdated: data?.lastUpdated,
    isLoading,
    isError: !!error,
  };
}
