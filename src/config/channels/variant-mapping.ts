/**
 * Variant-channel mapping — defines which channel categories
 * and countries each dashboard variant prioritizes.
 */

export interface VariantChannelPrefs {
  /** Channel categories shown first in this variant */
  primaryCategories: string[];
  /** Countries whose channels get boosted in sort order */
  boostCountries?: string[];
}

export const VARIANT_CHANNEL_PREFS: Record<string, VariantChannelPrefs> = {
  world: {
    primaryCategories: ["news", "business", "sports", "documentary"],
  },
  conflict: {
    primaryCategories: ["news"],
    boostCountries: ["UA", "IL", "IQ", "IR", "SY", "YE", "SD"],
  },
  tech: {
    primaryCategories: ["news", "business"],
    boostCountries: ["US", "JP", "KR", "CN"],
  },
  finance: {
    primaryCategories: ["business"],
    boostCountries: ["US", "GB", "DE", "JP", "CN"],
  },
  commodity: {
    primaryCategories: ["business", "news"],
    boostCountries: ["US", "SA", "AE", "RU"],
  },
  happy: {
    primaryCategories: ["news", "documentary"],
  },
  cyber: {
    primaryCategories: ["news", "business"],
    boostCountries: ["US", "IL", "GB"],
  },
  weather: {
    primaryCategories: ["news"],
  },
  health: {
    primaryCategories: ["news"],
  },
  energy: {
    primaryCategories: ["business", "news"],
    boostCountries: ["US", "SA", "RU", "NO"],
  },
  sports: {
    primaryCategories: ["sports"],
  },
};
