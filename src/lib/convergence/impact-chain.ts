import type { Category } from "@/types/intel";
import type { ImpactLink, ConvergenceType } from "./types";

// ── Predefined causal relationships between categories ─

interface CausalRule {
  from: Category;
  to: Category;
  confidence: number;
  description: string;
  bidirectional?: boolean;
}

const CAUSAL_RULES: CausalRule[] = [
  // Conflict cascades
  { from: "conflict", to: "energy",    confidence: 0.85, description: "Armed conflict disrupts energy supply chains" },
  { from: "conflict", to: "finance",   confidence: 0.80, description: "Geopolitical tension triggers market volatility" },
  { from: "conflict", to: "health",    confidence: 0.70, description: "Conflict zone creates humanitarian health crisis" },
  { from: "conflict", to: "diplomacy", confidence: 0.85, description: "Military escalation triggers diplomatic response" },
  { from: "conflict", to: "aviation",  confidence: 0.75, description: "Conflict zone affects aviation routes and safety" },

  // Energy cascades
  { from: "energy", to: "finance", confidence: 0.90, description: "Energy price shock cascades to financial markets" },
  { from: "energy", to: "health",  confidence: 0.55, description: "Energy disruption impacts hospital infrastructure" },

  // Cyber cascades
  { from: "cyber", to: "finance", confidence: 0.75, description: "Cyber attack disrupts financial systems" },
  { from: "cyber", to: "energy",  confidence: 0.70, description: "Infrastructure attack affects power grid" },
  { from: "cyber", to: "tech",    confidence: 0.80, description: "Cyber vulnerability impacts tech ecosystem" },

  // Natural disaster cascades
  { from: "natural", to: "health",    confidence: 0.80, description: "Natural disaster creates health emergency" },
  { from: "natural", to: "energy",    confidence: 0.65, description: "Disaster disrupts energy infrastructure" },
  { from: "natural", to: "finance",   confidence: 0.60, description: "Natural catastrophe impacts insurance and markets" },
  { from: "natural", to: "aviation",  confidence: 0.70, description: "Severe weather disrupts air travel" },

  // Health cascades
  { from: "health", to: "finance",   confidence: 0.65, description: "Health crisis impacts economic activity" },
  { from: "health", to: "diplomacy", confidence: 0.55, description: "Pandemic triggers international coordination" },

  // Diplomacy cascades
  { from: "diplomacy", to: "finance", confidence: 0.70, description: "Sanctions or treaties affect trade and markets" },
  { from: "diplomacy", to: "energy",  confidence: 0.65, description: "Trade agreements reshape energy supply" },

  // Tech cascades
  { from: "tech", to: "finance", confidence: 0.60, description: "Tech disruption impacts market sectors" },
  { from: "tech", to: "cyber",   confidence: 0.65, description: "New technology creates attack surface" },

  // Protest cascades
  { from: "protest", to: "diplomacy", confidence: 0.60, description: "Mass protests force political response" },
  { from: "protest", to: "finance",   confidence: 0.50, description: "Civil unrest affects business confidence" },
  { from: "protest", to: "conflict",  confidence: 0.55, description: "Protests escalate to armed confrontation" },
];

// Build lookup map for O(1) access
const RULE_MAP = new Map<string, CausalRule>();
for (const rule of CAUSAL_RULES) {
  RULE_MAP.set(`${rule.from}→${rule.to}`, rule);
}

/**
 * Public list of all causal rules — used by forward-prediction.ts to
 * iterate "what comes after X?" Exposes the same data as the internal
 * RULE_MAP without giving callers mutable access.
 */
export const CAUSAL_RULES_LIST: ReadonlyArray<CausalRule> = CAUSAL_RULES;

/**
 * Find all impact chain links between the given categories.
 * Returns direct links and one-hop transitive links.
 *
 * Example: [conflict, energy, finance] →
 *   conflict→energy (0.85), energy→finance (0.90), conflict→finance (0.80)
 */
export function resolveImpactChain(categories: Category[]): ImpactLink[] {
  const links: ImpactLink[] = [];
  const seen = new Set<string>();

  // Direct links between present categories
  for (const from of categories) {
    for (const to of categories) {
      if (from === to) continue;
      const key = `${from}→${to}`;
      const rule = RULE_MAP.get(key);
      if (rule && !seen.has(key)) {
        links.push({
          from: rule.from,
          to: rule.to,
          confidence: rule.confidence,
          description: rule.description,
        });
        seen.add(key);
      }
    }
  }

  // Transitive links (A→B→C where B is present)
  for (const mid of categories) {
    for (const rule1 of CAUSAL_RULES) {
      if (rule1.to !== mid) continue;
      if (!categories.includes(rule1.from)) continue;

      for (const rule2 of CAUSAL_RULES) {
        if (rule2.from !== mid) continue;
        if (!categories.includes(rule2.to)) continue;

        const transitiveKey = `${rule1.from}→${rule2.to}(via ${mid})`;
        if (seen.has(transitiveKey)) continue;
        // Don't duplicate direct links
        const directKey = `${rule1.from}→${rule2.to}`;
        if (seen.has(directKey)) continue;

        // Transitive confidence = product of individual confidences × decay
        const transitiveConf = rule1.confidence * rule2.confidence * 0.85;
        if (transitiveConf >= 0.3) {
          links.push({
            from: rule1.from,
            to: rule2.to,
            confidence: Math.round(transitiveConf * 100) / 100,
            description: `${rule1.description} → ${rule2.description}`,
          });
          seen.add(transitiveKey);
        }
      }
    }
  }

  return links.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Determine the convergence type from involved categories.
 */
export function classifyConvergence(categories: Category[]): ConvergenceType {
  const cats = new Set(categories);

  if (cats.has("conflict") && (cats.has("diplomacy") || cats.has("energy") || cats.has("finance"))) {
    return "geopolitical";
  }
  if (cats.has("energy") && cats.has("finance")) {
    return "economic_cascade";
  }
  if (cats.has("cyber") && (cats.has("energy") || cats.has("finance"))) {
    return "cyber_infrastructure";
  }
  if ((cats.has("conflict") || cats.has("natural")) && cats.has("health")) {
    return "humanitarian";
  }
  if (cats.has("natural") && (cats.has("energy") || cats.has("health"))) {
    return "environmental";
  }

  return "multi_signal";
}

/**
 * Calculate impact chain bonus for convergence scoring.
 * More causal links = higher confidence that signals are truly connected.
 */
export function getChainBonus(links: ImpactLink[]): number {
  if (links.length === 0) return 1.0; // No chain = neutral

  // Average confidence of all links, scaled as a multiplier
  const avgConf = links.reduce((sum, l) => sum + l.confidence, 0) / links.length;

  // Bonus: 1.0 (no links) to 1.3 (strong chain)
  return 1.0 + avgConf * 0.3;
}
