import type { Category } from "@/types/intel";

/**
 * TroiaMedia Variants — different "views" of the intelligence dashboard.
 * Each variant is named after a Greek deity whose domain matches the focus.
 *
 * Variants:
 * - Olympus: Full intelligence dashboard (default) — seat of the gods
 * - Ares: Conflict & Security — god of war
 * - Hephaestus: Technology — god of the forge & craft
 * - Hermes: Finance — god of commerce & trade
 * - Athena: Cyber — goddess of wisdom & strategy
 * - Poseidon: Weather — god of seas & storms
 * - Apollo: Health — god of healing
 * - Zeus: Energy — god of lightning & power
 * - Nike: Sports — goddess of victory
 * - Demeter: Commodity — goddess of harvest
 * - Eirene: Good News — goddess of peace
 */

export type VariantId = "world" | "tech" | "finance" | "commodity" | "happy" | "conflict" | "cyber" | "weather" | "health" | "energy" | "sports";

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
    name: "Olympus",
    tagline: "Pantheon Intelligence Command",
    description: "The throne of the gods — real-time global intelligence, conflict, and security monitoring.",
    primaryCategories: ["conflict", "natural", "diplomacy", "protest", "health"],
    secondaryCategories: ["cyber", "finance", "tech", "energy", "aviation", "sports"],
    defaultLayers: ["conflicts", "natural"],
    accent: "#d4af37",
    icon: "⚡",
    keywords: ["intelligence", "conflict", "geopolitics", "security", "OSINT"],
  },

  tech: {
    id: "tech",
    name: "Hephaestus",
    tagline: "The Divine Forge — Technology Monitor",
    description: "AI, cybersecurity, semiconductors, space — forged in the fires of innovation.",
    primaryCategories: ["tech", "cyber"],
    secondaryCategories: ["energy"],
    defaultLayers: ["cyber", "tech"],
    accent: "#ff6b35",
    icon: "🔨",
    keywords: ["technology", "AI", "cybersecurity", "semiconductors", "space"],
  },

  finance: {
    id: "finance",
    name: "Hermes",
    tagline: "Messenger of Markets",
    description: "Markets, crypto, commodities — swift as the winged messenger of the gods.",
    primaryCategories: ["finance"],
    secondaryCategories: ["energy"],
    defaultLayers: ["markets"],
    accent: "#ffd000",
    icon: "🪽",
    keywords: ["markets", "finance", "crypto", "commodities", "forex"],
  },

  commodity: {
    id: "commodity",
    name: "Demeter",
    tagline: "Harvest & Commodity Oracle",
    description: "Oil, gas, metals, agriculture — the bounty of the earth goddess.",
    primaryCategories: ["energy", "finance"],
    secondaryCategories: [],
    defaultLayers: ["markets"],
    accent: "#c8a951",
    icon: "🌾",
    keywords: ["oil", "gas", "commodities", "energy", "metals", "agriculture"],
  },

  happy: {
    id: "happy",
    name: "Eirene",
    tagline: "Goddess of Peace — Good Tidings",
    description: "Breakthroughs, peace agreements, innovations — blessings from the goddess of peace.",
    primaryCategories: ["tech", "health", "diplomacy", "sports"],
    secondaryCategories: ["natural"],
    defaultLayers: ["natural"],
    accent: "#00ff88",
    icon: "🕊️",
    keywords: ["positive", "innovation", "peace", "breakthrough", "progress"],
  },

  conflict: {
    id: "conflict",
    name: "Ares",
    tagline: "God of War — Conflict Monitor",
    description: "Active conflicts, military operations — the domain of the war god.",
    primaryCategories: ["conflict", "protest"],
    secondaryCategories: ["diplomacy", "aviation"],
    defaultLayers: ["conflicts"],
    accent: "#ff4757",
    icon: "⚔️",
    keywords: ["conflict", "war", "military", "security", "OREF", "ACLED", "UCDP"],
  },

  cyber: {
    id: "cyber",
    name: "Athena",
    tagline: "Wisdom & Strategy — Cyber Intelligence",
    description: "Cyber threats, CVE vulnerabilities — guarded by the goddess of strategic warfare.",
    primaryCategories: ["cyber"],
    secondaryCategories: ["tech"],
    defaultLayers: ["cyber"],
    accent: "#7ec8e3",
    icon: "🦉",
    keywords: ["cybersecurity", "hacking", "CVE", "ransomware", "internet outages"],
  },

  weather: {
    id: "weather",
    name: "Poseidon",
    tagline: "Lord of Seas & Storms",
    description: "Extreme weather, earthquakes, tsunamis — the wrath of the sea god.",
    primaryCategories: ["natural"],
    secondaryCategories: ["health"],
    defaultLayers: ["natural"],
    accent: "#1e90ff",
    icon: "🔱",
    keywords: ["weather", "earthquake", "wildfire", "hurricane", "tsunami", "climate"],
  },

  health: {
    id: "health",
    name: "Apollo",
    tagline: "God of Healing — Health Intelligence",
    description: "Disease outbreaks, WHO alerts — under the watchful eye of the healer god.",
    primaryCategories: ["health"],
    secondaryCategories: ["natural"],
    defaultLayers: ["natural"],
    accent: "#f0c040",
    icon: "☀️",
    keywords: ["health", "pandemic", "outbreak", "WHO", "disease", "radiation"],
  },

  energy: {
    id: "energy",
    name: "Zeus",
    tagline: "Thunder & Power — Energy Monitor",
    description: "Oil, gas, nuclear, renewable energy — the lightning of the king of gods.",
    primaryCategories: ["energy"],
    secondaryCategories: ["finance"],
    defaultLayers: ["markets"],
    accent: "#e0c030",
    icon: "⚡",
    keywords: ["energy", "oil", "gas", "nuclear", "renewable", "power grid"],
  },

  sports: {
    id: "sports",
    name: "Nike",
    tagline: "Goddess of Victory — Sports Intelligence",
    description: "Live sports scores, transfers, match results — in the name of victory.",
    primaryCategories: ["sports"],
    secondaryCategories: [],
    defaultLayers: ["natural"],
    accent: "#22c55e",
    icon: "🏆",
    keywords: ["sports", "football", "basketball", "tennis", "olympics", "FIFA", "transfers"],
  },
};

export const DEFAULT_VARIANT: VariantId = "world";

/**
 * SEO-friendly metadata for programmatic /country/[code]/[variant]
 * pages. The Greek deity names are kept for brand flavor in VARIANTS
 * above, but the public-facing labels here are descriptive so search
 * engines and users understand them.
 */
export interface VariantSeoMeta {
  id: VariantId;
  label: string;
  labelTr: string;
  eventCategory: string; // matches events.category
  emoji: string;
  tagline: string;
}

export const VARIANT_SEO_META: Record<
  Exclude<VariantId, "world" | "tech">,
  VariantSeoMeta
> = {
  conflict: {
    id: "conflict",
    label: "Conflict Monitor",
    labelTr: "Çatışma İzleme",
    eventCategory: "conflict",
    emoji: "⚔️",
    tagline: "Live conflict, security incidents, military movements",
  },
  cyber: {
    id: "cyber",
    label: "Cyber Threat Intelligence",
    labelTr: "Siber Tehdit İstihbaratı",
    eventCategory: "cyber",
    emoji: "🛡️",
    tagline: "CVE disclosures, ransomware, infrastructure outages",
  },
  finance: {
    id: "finance",
    label: "Finance Intelligence",
    labelTr: "Finans İstihbaratı",
    eventCategory: "finance",
    emoji: "📊",
    tagline: "Markets, central banks, commodities",
  },
  weather: {
    id: "weather",
    label: "Weather & Disaster",
    labelTr: "Hava Durumu & Afet",
    eventCategory: "natural",
    emoji: "🌪️",
    tagline: "USGS, GDACS, Copernicus early warning",
  },
  health: {
    id: "health",
    label: "Health & Outbreak",
    labelTr: "Sağlık & Salgın",
    eventCategory: "health",
    emoji: "🏥",
    tagline: "WHO, ReliefWeb, disease surveillance",
  },
  energy: {
    id: "energy",
    label: "Energy Intelligence",
    labelTr: "Enerji İstihbaratı",
    eventCategory: "energy",
    emoji: "⚡",
    tagline: "Grid events, pipelines, refinery incidents",
  },
  commodity: {
    id: "commodity",
    label: "Commodity Intelligence",
    labelTr: "Emtia İstihbaratı",
    eventCategory: "finance",
    emoji: "📦",
    tagline: "Shipping, ports, supply-chain signals",
  },
  sports: {
    id: "sports",
    label: "Sports Intelligence",
    labelTr: "Spor İstihbaratı",
    eventCategory: "sports",
    emoji: "⚽",
    tagline: "Live scores, fixtures, transfer signals",
  },
  happy: {
    id: "happy",
    label: "Happy Feed",
    labelTr: "Mutlu Akış",
    eventCategory: "tech",
    emoji: "✨",
    tagline: "Good news, breakthroughs, uplift",
  },
};

/** IDs used for programmatic SEO — excludes the world/tech meta-variants */
export const SEO_VARIANT_IDS = Object.keys(
  VARIANT_SEO_META,
) as Array<keyof typeof VARIANT_SEO_META>;

export function getVariantSeoMeta(
  id: string,
): VariantSeoMeta | null {
  if (id in VARIANT_SEO_META) {
    return VARIANT_SEO_META[id as keyof typeof VARIANT_SEO_META];
  }
  return null;
}

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
