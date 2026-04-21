"use client";

import useSWR from "swr";
import { useTierInterval } from "./useTierInterval";
import type { AircraftState } from "@/types/tracking";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface FlightData {
  aircraft: AircraftState[];
  total: number;
  lastUpdated: string;
}

export function useFlightTracker() {
  // OpenSky free tier is 400 requests/day anonymous, 4000 authed.
  // Throttle free users to 5min so a busy dashboard session doesn't
  // drain the day's budget by noon.
  const refreshInterval = useTierInterval(30_000);

  const { data, error, isLoading } = useSWR<FlightData>(
    "/api/flights",
    fetcher,
    {
      refreshInterval,
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
