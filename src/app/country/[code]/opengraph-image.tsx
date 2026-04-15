import { generateModuleOgImage, ogSize, ogContentType } from "@/lib/og-image";
import { COUNTRY_MAP } from "@/config/countries";

export const runtime = "edge";
export const alt = "WorldScope Country Intelligence Dashboard";
export const size = ogSize;
export const contentType = ogContentType;

/**
 * Convert a 2-letter ISO country code to its regional indicator
 * flag emoji (no external data needed). 65 = 'A' offset; each
 * letter maps to a regional indicator symbol 🇦 (U+1F1E6) + offset.
 */
function flagFromCode(code: string): string {
  if (!code || code.length !== 2) return "🌍";
  const upper = code.toUpperCase();
  const first = upper.charCodeAt(0) - 65;
  const second = upper.charCodeAt(1) - 65;
  if (first < 0 || first > 25 || second < 0 || second > 25) return "🌍";
  return (
    String.fromCodePoint(0x1f1e6 + first) +
    String.fromCodePoint(0x1f1e6 + second)
  );
}

export default async function CountryOg({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const country = COUNTRY_MAP.get(code.toUpperCase());

  const title = country ? country.name : "Country Intel";
  const subtitle = country
    ? `${country.region} · Live dashboard`
    : "Global Intelligence Dashboard";

  return generateModuleOgImage({
    title,
    subtitle,
    emoji: flagFromCode(code),
    accentColor: "#00e5ff",
  });
}
