"use client";

import useSWR from "swr";
import { useTierInterval } from "./useTierInterval";
import type { VesselPosition } from "@/types/tracking";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface VesselData {
  vessels: VesselPosition[];
  total: number;
  lastUpdated: string;
}

export function useVesselTracker() {
  // AISStream free tier limits bandwidth per IP. Free users: 50min.
  // Gaia: 5min.
  const refreshInterval = useTierInterval(300_000);

  const { data, error, isLoading } = useSWR<VesselData>(
    "/api/vessels",
    fetcher,
    {
      refreshInterval,
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
