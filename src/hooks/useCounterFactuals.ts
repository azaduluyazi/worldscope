import useSWR from "swr";
import type { CounterFactualSignal } from "@/lib/convergence/counter-factual";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Counter-factuals API error: ${r.status}`);
    return r.json();
  });

interface UseCounterFactualsOptions {
  refreshInterval?: number;
}

export function useCounterFactuals(options: UseCounterFactualsOptions = {}) {
  const { refreshInterval = 60_000 } = options;

  const { data, error, isLoading, mutate } = useSWR<{
    status: string;
    data: { signals: CounterFactualSignal[]; count: number; timestamp: string };
  }>("/api/convergence/counter-factuals", fetcher, {
    refreshInterval,
    revalidateOnFocus: true,
    dedupingInterval: 30_000,
  });

  return {
    signals: data?.data?.signals ?? [],
    count: data?.data?.count ?? 0,
    timestamp: data?.data?.timestamp ?? null,
    error,
    isLoading,
    refresh: mutate,
  };
}
