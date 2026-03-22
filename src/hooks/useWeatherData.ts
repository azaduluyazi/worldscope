import useSWR from "swr";

export interface WeatherCity {
  lat: number;
  lng: number;
  city: string;
  country: string;
  temperature: number;
  windSpeed: number;
  weatherCode: number;
  weatherLabel: string;
  isExtreme: boolean;
}

interface WeatherResponse {
  cities: WeatherCity[];
  total: number;
  lastUpdated: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useWeatherData() {
  const { data, error, isLoading } = useSWR<WeatherResponse>(
    "/api/weather",
    fetcher,
    {
      refreshInterval: 300_000, // 5 min
      revalidateOnFocus: false,
      dedupingInterval: 120_000,
    }
  );

  return {
    cities: data?.cities || [],
    total: data?.total || 0,
    isLoading,
    isError: !!error,
  };
}
