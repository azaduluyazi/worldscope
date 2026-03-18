"use client";

import useSWR from "swr";
import type { AircraftState } from "@/types/tracking";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface FlightData {
  aircraft: AircraftState[];
  total: number;
  lastUpdated: string;
}

export function useFlightTracker() {
  const { data, error, isLoading } = useSWR<FlightData>(
    "/api/flights",
    fetcher,
    {
      refreshInterval: 30_000, // 30s refresh for real-time tracking
      revalidateOnFocus: true,
      dedupingInterval: 15_000,
    }
  );

  return {
    aircraft: data?.aircraft || [],
    total: data?.total || 0,
    lastUpdated: data?.lastUpdated,
    isLoading,
    isError: !!error,
  };
}
