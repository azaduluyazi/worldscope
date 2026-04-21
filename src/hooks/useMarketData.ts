import { useState, useEffect } from "react";
import useSWR from "swr";
import { useTierInterval } from "./useTierInterval";
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

  // Finnhub is our tightest quota (free tier: 60 calls/min). Free-tier
  // viewers poll at 5min so a quiet-hours page doesn't exhaust it;
  // Gaia subscribers get the 30s rate we designed for.
  const refreshInterval = useTierInterval(30_000);

  const { data, error, isLoading } = useSWR<MarketResponse>(
    enabled ? "/api/market" : null,
    fetcher,
    {
      refreshInterval,
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
