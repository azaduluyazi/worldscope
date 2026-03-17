import useSWR from "swr";

interface ThreatData {
  score: number;
  level: "critical" | "high" | "elevated" | "low";
  categories: Record<string, number>;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useThreatIndex() {
  const { data, error, isLoading } = useSWR<ThreatData>(
    "/api/threat",
    fetcher,
    {
      refreshInterval: 120_000,
    }
  );

  return {
    score: data?.score || 0,
    level: data?.level || "low",
    categories: data?.categories || {},
    isLoading,
    isError: !!error,
  };
}
