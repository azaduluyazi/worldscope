import { generateModuleOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "WorldScope Happy Feed — Good news and breakthroughs";
export const size = ogSize;
export const contentType = ogContentType;

export default function OgHappy() {
  return generateModuleOgImage({
    title: "HappyScope",
    subtitle: "Good news · breakthroughs · uplift",
    emoji: "✨",
    accentColor: "#ff69b4",
  });
}
