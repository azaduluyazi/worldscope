import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "WeatherScope — Weather & Natural Events",
  description: "Extreme weather, earthquakes, wildfires, volcanic eruptions, tsunami warnings, and climate monitoring.",
  keywords: ["weather", "earthquake", "wildfire", "hurricane", "tsunami", "climate"],
};
export default function WeatherLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
