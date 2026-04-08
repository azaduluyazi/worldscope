// ═══════════════════════════════════════════════════════════════════
//  EmbeddingProvider — pluggable embedding interface
// ═══════════════════════════════════════════════════════════════════
//
//  WHY this interface exists:
//  --------------------------
//  We chose Gemini text-embedding-004 (free tier, 1500 RPM, multilingual)
//  but we don't want to lock the convergence engine to a single vendor.
//  This interface lets us swap providers later (Cohere, OpenAI, Ollama+
//  bge-m3 self-hosted) by changing one factory line.
//
//  Cosine similarity is provided here so callers don't reinvent it.
// ═══════════════════════════════════════════════════════════════════

export interface EmbeddingProvider {
  /** Human-readable name for logging */
  readonly name: string;
  /** Output dimensionality (used for storage planning) */
  readonly dimensions: number;
  /**
   * Embed a single string. Returns a Float32-compatible array.
   * Throws on API error — caller is responsible for retry/fallback.
   */
  embed(text: string): Promise<number[]>;
  /**
   * Embed many strings in one batch call. Implementations should
   * use the provider's batch endpoint if available.
   */
  embedBatch(texts: string[]): Promise<number[][]>;
}

/**
 * Cosine similarity between two embedding vectors.
 * Assumes both vectors are non-zero.
 *
 * Returns a number in [-1, 1] where:
 *   1.0 = identical direction (same meaning)
 *   0.0 = orthogonal (unrelated)
 *  -1.0 = opposite direction (rare for text embeddings)
 *
 * For semantic clustering thresholds: > 0.85 typically means "same
 * topic"; > 0.92 typically means "near duplicate".
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `cosineSimilarity: vector length mismatch (${a.length} vs ${b.length})`
    );
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}
