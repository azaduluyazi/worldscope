import { generateModuleOgImage, ogSize, ogContentType } from "@/lib/og-image";
import { COUNTRY_MAP } from "@/config/countries";
import { getVariantSeoMeta } from "@/config/variants";

export const runtime = "edge";
export const alt = "WorldScope country-variant intelligence dashboard";
export const size = ogSize;
export const contentType = ogContentType;

const VARIANT_ACCENT: Record<string, string> = {
  conflict: "#ff4757",
  cyber: "#8a5cf6",
  finance: "#00ff88",
  weather: "#00e5ff",
  health: "#ffd000",
  energy: "#ffd000",
  commodity: "#ffa500",
  sports: "#00ff88",
  happy: "#ff69b4",
};

export default async function CountryVariantOg({
  params,
}: {
  params: Promise<{ code: string; variant: string }>;
}) {
  const { code, variant } = await params;
  const country = COUNTRY_MAP.get(code.toUpperCase());
  const meta = getVariantSeoMeta(variant);

  const title = country ? `${country.name}` : "Country Intel";
  const subtitle = meta
    ? `${meta.label} · ${new Date().getFullYear()}`
    : "Global Intelligence";

  return generateModuleOgImage({
    title,
    subtitle,
    emoji: meta?.emoji || "🌍",
    accentColor: VARIANT_ACCENT[variant] || "#00e5ff",
  });
}
