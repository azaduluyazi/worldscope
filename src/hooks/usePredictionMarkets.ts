import useSWR from "swr";
import type { PredictionMarket } from "@/types/tracking";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface PredictionResponse {
  markets: PredictionMarket[];
  total: number;
}

export function usePredictionMarkets() {
  const { data, error, isLoading } = useSWR<PredictionResponse>(
    "/api/predictions",
    fetcher,
    {
      refreshInterval: 300_000, // 5 min
      revalidateOnFocus: false,
      dedupingInterval: 120_000,
    }
  );

  return {
    markets: data?.markets || [],
    total: data?.total || 0,
    isLoading,
    isError: !!error,
  };
}
