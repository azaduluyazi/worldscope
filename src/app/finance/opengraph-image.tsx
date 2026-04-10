import { generateModuleOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "FinScope — Financial Intelligence Dashboard";
export const size = ogSize;
export const contentType = ogContentType;

export default function OgImage() {
  return generateModuleOgImage({
    title: "FinScope",
    subtitle: "Financial Intelligence Dashboard",
    emoji: "📈",
    accentColor: "#ffd000",
  });
}
