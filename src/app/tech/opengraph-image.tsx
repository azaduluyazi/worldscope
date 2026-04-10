import { generateModuleOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "TechScope — Technology Intelligence Monitor";
export const size = ogSize;
export const contentType = ogContentType;

export default function OgImage() {
  return generateModuleOgImage({
    title: "TechScope",
    subtitle: "Technology Intelligence Monitor",
    emoji: "🔬",
    accentColor: "#00e5ff",
  });
}
