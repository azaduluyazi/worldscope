import { COUNTRIES, type CountryMeta } from "@/config/countries";
import type { Severity } from "@/types/intel";

/** Convert ISO 3166-1 alpha-2 code to flag emoji */
export function getFlagEmoji(code: string): string {
  const offset = 127397;
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + offset))
    .join("");
}

/** Get all countries in a given region */
export function getRegionCountries(region: string): CountryMeta[] {
  return COUNTRIES.filter((c) => c.region === region);
}

/** Get previous/next country within the same region (wrapping) */
export function getNeighborCountries(code: string): { prev: CountryMeta | null; next: CountryMeta | null } {
  const country = COUNTRIES.find((c) => c.code === code.toUpperCase());
  if (!country) return { prev: null, next: null };

  const regionCountries = COUNTRIES.filter((c) => c.region === country.region);
  const idx = regionCountries.findIndex((c) => c.code === country.code);

  const prev = regionCountries[(idx - 1 + regionCountries.length) % regionCountries.length];
  const next = regionCountries[(idx + 1) % regionCountries.length];

  return { prev: prev || null, next: next || null };
}

/** Severity weights matching existing threat scoring convention */
const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 10,
  high: 6,
  medium: 3,
  low: 1,
  info: 0,
};

/** Compute country-level threat score (0-100) using distribution-weighted average */
export function computeCountryThreat(events: { severity: Severity | string }[]): number {
  if (events.length === 0) return 0;

  const totalWeight = events.reduce((sum, e) => {
    return sum + (SEVERITY_WEIGHTS[e.severity as Severity] ?? 0);
  }, 0);

  const maxPossible = events.length * 10;
  const raw = (totalWeight / maxPossible) * 100;

  return Math.min(100, Math.round(raw));
}
