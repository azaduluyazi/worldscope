"use client";
import useSWR from "swr";
import type { PowerOutage } from "@/types/tracking";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useOutages() {
  const { data, isLoading } = useSWR<{ outages: PowerOutage[] }>(
    "/api/outages", fetcher, { refreshInterval: 300_000 }
  );
  return { outages: data?.outages || [], isLoading };
}
