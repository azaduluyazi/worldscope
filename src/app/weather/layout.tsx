import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "WeatherScope — Weather & Natural Events",
  description: "Extreme weather, earthquakes, wildfires, volcanic eruptions, tsunami warnings, and climate monitoring.",
  keywords: [
    "weather dashboard", "earthquake tracker", "wildfire map",
    "hurricane tracker", "tsunami alert", "climate monitor",
    "USGS earthquake live", "NASA FIRMS fire detection",
    "natural disaster map", "flood forecast", "volcanic activity",
    "real-time weather alerts", "extreme weather monitor",
    "deprem takip", "doğal afet haritası", "hava durumu",
  ],
  alternates: { canonical: "/weather" },
};
export default function WeatherLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
