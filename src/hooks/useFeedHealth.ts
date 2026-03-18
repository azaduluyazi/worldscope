import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface FeedHealthData {
  total: number;
  active: number;
  unhealthy: number;
  deactivated: number;
  byCategory: Record<string, { active: number; total: number }>;
  timestamp: string;
}

interface FeedListData {
  feeds: Array<{
    id: string;
    name: string;
    url: string;
    category: string;
    is_active: boolean;
    error_count: number;
    last_fetched_at: string | null;
    created_at: string;
  }>;
  total: number;
  healthy: number;
}

export function useFeedHealth() {
  return useSWR<FeedHealthData>("/api/feeds/health", fetcher, {
    refreshInterval: 30_000,
  });
}

export function useFeedList(category?: string) {
  const params = category ? `?category=${category}` : "";
  return useSWR<FeedListData>(`/api/feeds${params}`, fetcher, {
    refreshInterval: 60_000,
  });
}
