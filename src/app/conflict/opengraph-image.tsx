import { generateModuleOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "ConflictScope — Conflict & Security Monitor";
export const size = ogSize;
export const contentType = ogContentType;

export default function OgImage() {
  return generateModuleOgImage({
    title: "ConflictScope",
    subtitle: "Conflict & Security Monitor",
    emoji: "⚔️",
    accentColor: "#ff4757",
  });
}
