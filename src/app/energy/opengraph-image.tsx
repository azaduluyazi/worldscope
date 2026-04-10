import { generateModuleOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "EnergyScope — Energy & Infrastructure Monitor";
export const size = ogSize;
export const contentType = ogContentType;

export default function OgImage() {
  return generateModuleOgImage({
    title: "EnergyScope",
    subtitle: "Energy & Infrastructure Monitor",
    emoji: "⚡",
    accentColor: "#ffab00",
  });
}
