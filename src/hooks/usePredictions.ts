"use client";
import useSWR from "swr";
import type { PredictionMarket } from "@/types/tracking";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function usePredictions() {
  const { data, isLoading } = useSWR<{ markets: PredictionMarket[] }>(
    "/api/predictions", fetcher, { refreshInterval: 300_000 }
  );
  return { markets: data?.markets || [], isLoading };
}
