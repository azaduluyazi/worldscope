import type { EmbeddingProvider } from "./provider";
import { GeminiEmbeddingProvider } from "./gemini";

// ═══════════════════════════════════════════════════════════════════
//  Embedding factory + singleton accessor
// ═══════════════════════════════════════════════════════════════════
//
//  Single source of truth for which embedding provider the convergence
//  engine uses. To swap providers (Cohere, OpenAI, self-hosted bge-m3),
//  change THIS file only.
//
//  Required env var: GEMINI_API_KEY
// ═══════════════════════════════════════════════════════════════════

let cached: EmbeddingProvider | null = null;

export function getEmbeddingProvider(): EmbeddingProvider {
  if (cached) return cached;
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "getEmbeddingProvider: GEMINI_API_KEY env var is missing. " +
      "Get one from https://aistudio.google.com/app/apikey (free tier)."
    );
  }
  cached = new GeminiEmbeddingProvider(key);
  return cached;
}

/** For tests / dependency injection */
export function setEmbeddingProvider(provider: EmbeddingProvider): void {
  cached = provider;
}

export type { EmbeddingProvider } from "./provider";
export { cosineSimilarity } from "./provider";
