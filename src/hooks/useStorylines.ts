import useSWR from "swr";
import type { Storyline } from "@/lib/convergence/storyline";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Storylines API error: ${r.status}`);
    return r.json();
  });

interface UseStorylinesOptions {
  limit?: number;
  refreshInterval?: number;
}

export function useStorylines(options: UseStorylinesOptions = {}) {
  const { limit = 20, refreshInterval = 120_000 } = options;

  const { data, error, isLoading, mutate } = useSWR<{
    status: string;
    data: { storylines: Storyline[]; count: number; timestamp: string };
  }>(`/api/convergence/storylines?limit=${limit}`, fetcher, {
    refreshInterval,
    revalidateOnFocus: true,
    dedupingInterval: 60_000,
  });

  return {
    storylines: data?.data?.storylines ?? [],
    count: data?.data?.count ?? 0,
    timestamp: data?.data?.timestamp ?? null,
    error,
    isLoading,
    refresh: mutate,
  };
}
