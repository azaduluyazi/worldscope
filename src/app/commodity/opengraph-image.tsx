import { generateModuleOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "WorldScope Commodity Intelligence — Shipping, ports, supply chain";
export const size = ogSize;
export const contentType = ogContentType;

export default function OgCommodity() {
  return generateModuleOgImage({
    title: "CommodityScope",
    subtitle: "Shipping · Ports · Supply Chain",
    emoji: "📦",
    accentColor: "#ffa500",
  });
}
