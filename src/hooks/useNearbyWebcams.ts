import useSWR from "swr";
import type { Webcam } from "@/lib/api/windy-webcams";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useNearbyWebcams(lat?: number, lng?: number) {
  const key =
    lat != null && lng != null
      ? `/api/webcams?lat=${lat}&lng=${lng}&radius=50&limit=3`
      : null;

  const { data, isLoading, error } = useSWR<{ webcams: Webcam[] }>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000,
  });

  return {
    webcams: data?.webcams ?? [],
    isLoading,
    error,
  };
}
