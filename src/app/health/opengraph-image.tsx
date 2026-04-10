import { generateModuleOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "HealthScope — Global Health Monitor";
export const size = ogSize;
export const contentType = ogContentType;

export default function OgImage() {
  return generateModuleOgImage({
    title: "HealthScope",
    subtitle: "Global Health Monitor",
    emoji: "🏥",
    accentColor: "#e91e63",
  });
}
