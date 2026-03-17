import useSWR from "swr";
import type { MarketDataResponse } from "@/types/market";
import type { FearGreedData } from "@/lib/api/fear-greed";

interface MarketResponse extends MarketDataResponse {
  fearGreed?: FearGreedData | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useMarketData() {
  const { data, error, isLoading } = useSWR<MarketResponse>(
    "/api/market",
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
    }
  );

  return {
    quotes: data?.quotes || [],
    fearGreed: data?.fearGreed || null,
    lastUpdated: data?.lastUpdated,
    isLoading,
    isError: !!error,
  };
}
