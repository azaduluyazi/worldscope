import { generateModuleOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "WeatherScope — Weather & Natural Events Monitor";
export const size = ogSize;
export const contentType = ogContentType;

export default function OgImage() {
  return generateModuleOgImage({
    title: "WeatherScope",
    subtitle: "Weather & Natural Events Monitor",
    emoji: "🌊",
    accentColor: "#4fc3f7",
  });
}
