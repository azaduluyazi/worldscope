import type { Category } from "@/types/intel";

/**
 * WorldScope Variants — different "views" of the intelligence dashboard.
 * Each variant focuses on specific categories and data sources.
 *
 * Variants:
 * - World: Full intelligence dashboard (default)
 * - Tech: Technology, AI, cyber, space focus
 * - Finance: Markets, crypto, commodities, central banks
 */

export type VariantId = "world" | "tech" | "finance" | "commodity" | "happy";

export interface Variant {
  id: VariantId;
  name: string;
  tagline: string;
  description: string;
  /** Primary categories shown in feed */
  primaryCategories: Category[];
  /** Categories shown but de-emphasized */
  secondaryCategories: Category[];
  /** Map layer defaults */
  defaultLayers: string[];
  /** Color accent override */
  accent: string;
  /** Icon */
  icon: string;
  /** SEO keywords */
  keywords: string[];
}

export const VARIANTS: Record<VariantId, Variant> = {
  world: {
    id: "world",
    name: "WorldScope",
    tagline: "Global Intelligence Dashboard",
    description: "Real-time global intelligence, conflict, and security monitoring.",
    primaryCategories: ["conflict", "natural", "diplomacy", "protest", "health"],
    secondaryCategories: ["cyber", "finance", "tech", "energy", "aviation"],
    defaultLayers: ["conflicts", "natural"],
    accent: "#00e5ff",
    icon: "🌍",
    keywords: ["intelligence", "conflict", "geopolitics", "security", "OSINT"],
  },

  tech: {
    id: "tech",
    name: "TechScope",
    tagline: "Technology Intelligence Monitor",
    description: "AI, cybersecurity, semiconductors, space, and technology monitoring.",
    primaryCategories: ["tech", "cyber"],
    secondaryCategories: ["finance", "energy", "conflict"],
    defaultLayers: ["cyber", "tech"],
    accent: "#8a5cf6",
    icon: "💻",
    keywords: ["technology", "AI", "cybersecurity", "semiconductors", "space"],
  },

  finance: {
    id: "finance",
    name: "FinScope",
    tagline: "Financial Intelligence Dashboard",
    description: "Markets, crypto, commodities, central banks, and economic monitoring.",
    primaryCategories: ["finance", "energy"],
    secondaryCategories: ["diplomacy", "tech", "conflict"],
    defaultLayers: ["markets"],
    accent: "#ffd000",
    icon: "📊",
    keywords: ["markets", "finance", "crypto", "commodities", "forex"],
  },

  commodity: {
    id: "commodity",
    name: "CommodityScope",
    tagline: "Commodity & Energy Intelligence",
    description: "Oil, gas, metals, agriculture, and energy infrastructure monitoring.",
    primaryCategories: ["energy", "finance"],
    secondaryCategories: ["conflict", "natural", "diplomacy"],
    defaultLayers: ["markets"],
    accent: "#ff9f43",
    icon: "⚡",
    keywords: ["oil", "gas", "commodities", "energy", "metals", "agriculture"],
  },

  happy: {
    id: "happy",
    name: "GoodScope",
    tagline: "Positive Global Intelligence",
    description: "Breakthroughs, peace agreements, innovations, and positive developments worldwide.",
    primaryCategories: ["tech", "health", "diplomacy"],
    secondaryCategories: ["finance", "natural"],
    defaultLayers: ["natural"],
    accent: "#00ff88",
    icon: "🌟",
    keywords: ["positive", "innovation", "peace", "breakthrough", "progress"],
  },
};

export const DEFAULT_VARIANT: VariantId = "world";

/**
 * Get categories to show for a variant.
 * Primary categories get full weight, secondary get lower priority.
 */
export function getVariantCategories(variantId: VariantId): {
  primary: Set<Category>;
  all: Set<Category>;
} {
  const variant = VARIANTS[variantId];
  return {
    primary: new Set(variant.primaryCategories),
    all: new Set([...variant.primaryCategories, ...variant.secondaryCategories]),
  };
}

/**
 * Filter feeds by variant — only include feeds whose category
 * matches the variant's primary or secondary categories.
 */
export function filterFeedsByVariant(
  feeds: Array<{ category: string }>,
  variantId: VariantId
): typeof feeds {
  const { all } = getVariantCategories(variantId);
  return feeds.filter((f) => all.has(f.category as Category));
}
