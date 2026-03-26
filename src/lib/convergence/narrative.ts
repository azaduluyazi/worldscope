import { generateText } from "ai";
import { briefModel } from "@/lib/ai/providers";
import type { Convergence } from "./types";

/**
 * Generate an AI narrative for a convergence event.
 * Only called for convergences with confidence > 0.7.
 * Uses Groq (llama-3.3-70b) for fast, cost-effective generation.
 */
export async function generateNarrative(
  convergence: Omit<Convergence, "narrative">
): Promise<string> {
  const signalSummary = convergence.signals
    .map((s) => `- [${s.category.toUpperCase()}] ${s.title} (source: ${s.sourceId}, reliability: ${s.reliability})`)
    .join("\n");

  const chainSummary = convergence.impactChain.length > 0
    ? convergence.impactChain
        .map((l) => `  ${l.from} → ${l.to} (${Math.round(l.confidence * 100)}%): ${l.description}`)
        .join("\n")
    : "No causal chain identified.";

  const prompt = `You are a geopolitical intelligence analyst. Analyze this multi-signal convergence and write a concise tactical brief (2-3 sentences max).

CONVERGENCE TYPE: ${convergence.type}
CONFIDENCE: ${Math.round(convergence.confidence * 100)}%
LOCATION: ${convergence.location.lat.toFixed(2)}°, ${convergence.location.lng.toFixed(2)}°
TIME WINDOW: ${convergence.timeline.start} to ${convergence.timeline.end}
AFFECTED REGIONS: ${convergence.affectedRegions.join(", ")}

SIGNALS:
${signalSummary}

IMPACT CHAIN:
${chainSummary}

Write a tactical intelligence brief. Be specific about what the convergence means. No speculation beyond the data. Use present tense. Start with the primary threat/event.`;

  try {
    const { text } = await generateText({
      model: briefModel,
      prompt,
      temperature: 0.3, // Low temp for factual output
    });

    return text.trim();
  } catch (error) {
    // Fallback: generate a mechanical summary without LLM
    return generateFallbackNarrative(convergence);
  }
}

/**
 * Fallback narrative when LLM is unavailable.
 * Produces a structured but less natural summary.
 */
function generateFallbackNarrative(
  convergence: Omit<Convergence, "narrative">
): string {
  const categoryNames = [...new Set(convergence.signals.map((s) => s.category))];
  const topSignal = convergence.signals[0];
  const regionList = convergence.affectedRegions.join(", ");

  const chainDesc = convergence.impactChain.length > 0
    ? ` Impact chain: ${convergence.impactChain.map((l) => `${l.from}→${l.to}`).join(", ")}.`
    : "";

  return `${convergence.type.replace(/_/g, " ")} convergence detected near ${convergence.location.lat.toFixed(1)}°, ${convergence.location.lng.toFixed(1)}°. ${convergence.signals.length} signals across ${categoryNames.join(", ")} categories. Primary signal: ${topSignal.title}.${chainDesc} Affected regions: ${regionList}. Confidence: ${Math.round(convergence.confidence * 100)}%.`;
}

/**
 * Batch generate narratives for multiple convergences.
 * Only processes those above the confidence threshold.
 */
export async function batchGenerateNarratives(
  convergences: Omit<Convergence, "narrative">[],
  minConfidence = 0.7
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  const eligible = convergences.filter((c) => c.confidence >= minConfidence);

  // Process sequentially to respect rate limits
  for (const conv of eligible) {
    const narrative = await generateNarrative(conv);
    results.set(conv.id, narrative);
  }

  return results;
}
