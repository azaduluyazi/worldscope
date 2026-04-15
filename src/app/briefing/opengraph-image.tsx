import { generateModuleOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "The Sunday Convergence Report — Free weekly intelligence briefing";
export const size = ogSize;
export const contentType = ogContentType;

export default function OgBriefing() {
  return generateModuleOgImage({
    title: "Sunday Convergence Report",
    subtitle: "Free weekly intelligence briefing",
    emoji: "🛰️",
    accentColor: "#00e5ff",
  });
}
