import { generateModuleOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "SportScope — Sports Intelligence Dashboard";
export const size = ogSize;
export const contentType = ogContentType;

export default function OgImage() {
  return generateModuleOgImage({
    title: "SportScope",
    subtitle: "Sports Intelligence Dashboard",
    emoji: "⚽",
    accentColor: "#00ff88",
  });
}
