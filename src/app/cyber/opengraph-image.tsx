import { generateModuleOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "CyberScope — Cybersecurity Threat Monitor";
export const size = ogSize;
export const contentType = ogContentType;

export default function OgImage() {
  return generateModuleOgImage({
    title: "CyberScope",
    subtitle: "Cybersecurity Threat Monitor",
    emoji: "🛡️",
    accentColor: "#8a5cf6",
  });
}
