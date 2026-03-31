import type { IntelItem } from "@/types/intel";

// ── Types ─────────────────────────────────────────────────

export interface ScenarioResult {
  scenario: string;
  immediateEffects: string[];
  shortTermEffects: string[]; // 1-4 weeks
  longTermEffects: string[]; // 1-6 months
  affectedRegions: string[];
  riskLevel: "critical" | "high" | "medium" | "low";
  confidence: number; // 0-100
  relatedEvents: string[]; // titles of current events that relate
}

// ── Prompt Builder ────────────────────────────────────────

/**
 * Build a structured prompt for the LLM to analyze a geopolitical scenario.
 * Injects the top 20 recent events as context for grounding.
 */
export function buildScenarioPrompt(
  scenario: string,
  recentEvents: IntelItem[]
): string {
  const eventLines = recentEvents
    .slice(0, 20)
    .map(
      (e, i) =>
        `${i + 1}. [${e.severity.toUpperCase()}/${e.category.toUpperCase()}] ${e.title}`
    )
    .join("\n");

  return `You are a geopolitical analyst at a strategic intelligence agency. Given the following hypothetical scenario and recent world events, analyze the potential consequences.

SCENARIO: ${scenario}

RECENT EVENTS (last 24h):
${eventLines || "No recent events available."}

Respond ONLY in valid JSON format with this exact structure (no markdown, no explanation outside the JSON):
{
  "immediateEffects": ["effect1", "effect2", "effect3"],
  "shortTermEffects": ["effect within 1-4 weeks 1", "effect 2", "effect 3"],
  "longTermEffects": ["effect within 1-6 months 1", "effect 2", "effect 3"],
  "affectedRegions": ["region1", "region2"],
  "riskLevel": "critical" | "high" | "medium" | "low",
  "confidence": 0-100,
  "relatedEvents": ["title of related recent event 1", "title 2"]
}

Rules:
- immediateEffects: 3-5 effects that would happen within 48 hours
- shortTermEffects: 3-5 effects within 1-4 weeks
- longTermEffects: 3-5 effects within 1-6 months
- affectedRegions: list of countries or regions affected
- riskLevel: overall risk assessment
- confidence: 0-100 based on how predictable the outcome is
- relatedEvents: match titles from the RECENT EVENTS list that are relevant to this scenario`;
}

// ── Response Parser ───────────────────────────────────────

const VALID_RISK_LEVELS = new Set(["critical", "high", "medium", "low"]);

/**
 * Parse LLM JSON response safely.
 * Fallback: extract structured data from text if JSON.parse fails.
 */
export function parseScenarioResponse(text: string): Partial<ScenarioResult> {
  // Try direct JSON parse first
  try {
    const parsed = JSON.parse(text);
    return validateParsed(parsed);
  } catch {
    // noop — try extraction
  }

  // Try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim());
      return validateParsed(parsed);
    } catch {
      // noop
    }
  }

  // Try to find JSON object in text
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      const parsed = JSON.parse(braceMatch[0]);
      return validateParsed(parsed);
    } catch {
      // noop
    }
  }

  // Final fallback: extract bullet points from text
  return extractFromText(text);
}

function validateParsed(parsed: Record<string, unknown>): Partial<ScenarioResult> {
  const result: Partial<ScenarioResult> = {};

  if (Array.isArray(parsed.immediateEffects)) {
    result.immediateEffects = parsed.immediateEffects
      .filter((e): e is string => typeof e === "string")
      .slice(0, 5);
  }
  if (Array.isArray(parsed.shortTermEffects)) {
    result.shortTermEffects = parsed.shortTermEffects
      .filter((e): e is string => typeof e === "string")
      .slice(0, 5);
  }
  if (Array.isArray(parsed.longTermEffects)) {
    result.longTermEffects = parsed.longTermEffects
      .filter((e): e is string => typeof e === "string")
      .slice(0, 5);
  }
  if (Array.isArray(parsed.affectedRegions)) {
    result.affectedRegions = parsed.affectedRegions
      .filter((e): e is string => typeof e === "string")
      .slice(0, 10);
  }
  if (typeof parsed.riskLevel === "string" && VALID_RISK_LEVELS.has(parsed.riskLevel)) {
    result.riskLevel = parsed.riskLevel as ScenarioResult["riskLevel"];
  }
  if (typeof parsed.confidence === "number") {
    result.confidence = Math.max(0, Math.min(100, Math.round(parsed.confidence)));
  }
  if (Array.isArray(parsed.relatedEvents)) {
    result.relatedEvents = parsed.relatedEvents
      .filter((e): e is string => typeof e === "string")
      .slice(0, 5);
  }

  return result;
}

function extractFromText(text: string): Partial<ScenarioResult> {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^[-*]\s*/, "").trim())
    .filter((l) => l.length > 10);

  return {
    immediateEffects: lines.slice(0, 3),
    shortTermEffects: [],
    longTermEffects: [],
    affectedRegions: [],
    riskLevel: "medium",
    confidence: 30,
    relatedEvents: [],
  };
}
