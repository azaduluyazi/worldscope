"use client";

import useSWR from "swr";
import type { VesselPosition } from "@/types/tracking";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface VesselData {
  vessels: VesselPosition[];
  total: number;
  lastUpdated: string;
}

export function useVesselTracker() {
  const { data, error, isLoading } = useSWR<VesselData>(
    "/api/vessels",
    fetcher,
    {
      refreshInterval: 300_000, // 5min refresh
      revalidateOnFocus: true,
      dedupingInterval: 120_000,
    }
  );

  return {
    vessels: data?.vessels || [],
    total: data?.total || 0,
    lastUpdated: data?.lastUpdated,
    isLoading,
    isError: !!error,
  };
}
