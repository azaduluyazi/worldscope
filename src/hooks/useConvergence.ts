import useSWR from "swr";
import type { ConvergenceResponse } from "@/lib/convergence/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Convergence API error: ${r.status}`);
    return r.json();
  });

interface UseConvergenceOptions {
  minConfidence?: number;
  region?: string;
  refreshInterval?: number;
}

export function useConvergence(options: UseConvergenceOptions = {}) {
  const { minConfidence = 0.4, region, refreshInterval = 60_000 } = options;

  const params = new URLSearchParams();
  params.set("minConfidence", String(minConfidence));
  if (region) params.set("region", region);

  const { data, error, isLoading, mutate } = useSWR<{
    status: string;
    data: ConvergenceResponse & { metadata: { filters: Record<string, unknown> } };
  }>(
    `/api/convergence?${params.toString()}`,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 30_000,
    }
  );

  return {
    convergences: data?.data?.convergences ?? [],
    metadata: data?.data?.metadata ?? null,
    error,
    isLoading,
    refresh: mutate,
  };
}
