import { useState, useEffect } from "react";
import useSWR from "swr";
import type { MarketDataResponse } from "@/types/market";
import type { FearGreedData } from "@/lib/api/fear-greed";

interface MarketResponse extends MarketDataResponse {
  fearGreed?: FearGreedData | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useMarketData() {
  // Defer initial fetch by 1s to reduce TBT during page load
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEnabled(true), 1000);
    return () => clearTimeout(t);
  }, []);

  const { data, error, isLoading } = useSWR<MarketResponse>(
    enabled ? "/api/market" : null,
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: false,
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
