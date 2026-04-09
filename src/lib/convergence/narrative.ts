import { generateText } from "ai";
import { briefModel } from "@/lib/ai/providers";
import type { Convergence } from "./types";

// ═══════════════════════════════════════════════════════════════════
//  Narrative generation — hard latency budget
// ═══════════════════════════════════════════════════════════════════
//
//  These constants exist because narrative generation used to kill
//  the 5-minute convergence cron. The old implementation ran calls
//  sequentially with no timeout, so a single slow Groq response
//  (rate limit, cold start, provider hiccup) could block the entire
//  pipeline past the 60s Vercel maxDuration cap — no metrics row,
//  no Redis write, no history archive, silent cron death.
//
//  New policy:
//    - Each individual call is wrapped in an 8s AbortSignal timeout.
//      Slow calls fall back to the mechanical narrative instantly.
//    - The batch runs in parallel via Promise.allSettled so one
//      slow call doesn't starve the rest.
//    - Only the top 15 convergences by confidence get an LLM call;
//      the tail uses the fallback. This bounds the fan-out.
//
//  Combined worst case: 8s regardless of convergence count.
// ═══════════════════════════════════════════════════════════════════
const NARRATIVE_TIMEOUT_MS = 8000;
const MAX_NARRATIVES_PER_BATCH = 15;

/**
 * Generate an AI narrative for a convergence event.
 * Only called for convergences with confidence > 0.7.
 * Uses Groq (llama-3.3-70b) for fast, cost-effective generation.
 *
 * Hard-bounded at NARRATIVE_TIMEOUT_MS. Falls back to mechanical
 * narrative on ANY failure (timeout, rate limit, network, etc.)
 * so this function NEVER throws or blocks the cron.
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

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    NARRATIVE_TIMEOUT_MS
  );

  try {
    const { text } = await generateText({
      model: briefModel,
      prompt,
      temperature: 0.3, // Low temp for factual output
      abortSignal: controller.signal,
    });

    return text.trim();
  } catch {
    // Fallback: generate a mechanical summary without LLM.
    // Covers timeout, rate limit, network error, model-unavailable,
    // and any other Groq-side failure. Never rethrows.
    return generateFallbackNarrative(convergence);
  } finally {
    clearTimeout(timeoutId);
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
 *
 * Only processes those above the confidence threshold, AND at most
 * MAX_NARRATIVES_PER_BATCH of them (top by confidence). Runs in
 * parallel via Promise.allSettled so one slow call doesn't block
 * the rest. The tail (anything beyond the cap) gets a mechanical
 * fallback narrative so every high-confidence cluster still
 * displays SOMETHING in the UI.
 */
export async function batchGenerateNarratives(
  convergences: Omit<Convergence, "narrative">[],
  minConfidence = 0.7
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  const eligible = convergences
    .filter((c) => c.confidence >= minConfidence)
    .sort((a, b) => b.confidence - a.confidence);

  const llmBatch = eligible.slice(0, MAX_NARRATIVES_PER_BATCH);
  const fallbackBatch = eligible.slice(MAX_NARRATIVES_PER_BATCH);

  // Parallel LLM calls — each one self-bounds at NARRATIVE_TIMEOUT_MS
  // via its own AbortSignal, so the whole batch completes in 8s
  // worst case regardless of how many calls are in flight.
  const settled = await Promise.allSettled(
    llmBatch.map((conv) => generateNarrative(conv))
  );
  settled.forEach((outcome, i) => {
    if (outcome.status === "fulfilled") {
      results.set(llmBatch[i].id, outcome.value);
    } else {
      results.set(llmBatch[i].id, generateFallbackNarrative(llmBatch[i]));
    }
  });

  // Tail: mechanical fallback so UI never has a blank narrative.
  for (const conv of fallbackBatch) {
    results.set(conv.id, generateFallbackNarrative(conv));
  }

  return results;
}
