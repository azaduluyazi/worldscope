"use client";
import useSWR from "swr";
import type { RadiationReading } from "@/lib/api/radiation";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useRadiation() {
  const { data, isLoading } = useSWR<{ readings: RadiationReading[] }>(
    "/api/radiation", fetcher, { refreshInterval: 600_000 }
  );
  return { readings: data?.readings || [], isLoading };
}
