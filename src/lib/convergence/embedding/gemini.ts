import type { EmbeddingProvider } from "./provider";

// ═══════════════════════════════════════════════════════════════════
//  Gemini gemini-embedding-001 provider
// ═══════════════════════════════════════════════════════════════════
//
//  Free tier: 1500 requests/minute. WorldScope's expected hourly load
//  (~150 events × 1 embedding each = 150/hr) sits comfortably inside.
//
//  Endpoint:
//    POST https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent
//    POST https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents
//
//  Auth: ?key={GEMINI_API_KEY} query parameter
//
//  DIMENSIONS: gemini-embedding-001 natively returns 3072-dim vectors,
//  but supports Matryoshka Representation Learning — pass
//  outputDimensionality: 768 to get the leading 768 components. This
//  keeps WorldScope's pgvector schema (vector(768)) and the HNSW
//  index (capped at 2000 dims in pgvector) intact across the model
//  migration. Supported Matryoshka sizes: 128 / 256 / 512 / 768 /
//  1536 / 3072.
//
//  HISTORICAL NOTE: text-embedding-004 was deprecated by Google on
//  2026-01-14 and now returns 404 NOT_FOUND on v1beta. The migration
//  to gemini-embedding-001 is forced, not optional.
// ═══════════════════════════════════════════════════════════════════

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = "models/gemini-embedding-001";
const DIMENSIONS = 768;
const MAX_BATCH = 100; // Gemini batch limit

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly name = "gemini-embedding-001";
  readonly dimensions = DIMENSIONS;

  constructor(private readonly apiKey: string) {
    if (!apiKey) {
      throw new Error("GeminiEmbeddingProvider: API key is required (set GEMINI_API_KEY)");
    }
  }

  async embed(text: string): Promise<number[]> {
    const url = `${GEMINI_BASE}/${MODEL}:embedContent?key=${this.apiKey}`;
    const body = {
      model: MODEL,
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_DOCUMENT", // optimize for retrieval/dedup use case
      outputDimensionality: DIMENSIONS, // Matryoshka truncation → 768
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini embed failed (${res.status}): ${errText}`);
    }
    const data = (await res.json()) as { embedding: { values: number[] } };
    return data.embedding.values;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    if (texts.length > MAX_BATCH) {
      // Recurse over chunks of MAX_BATCH
      const out: number[][] = [];
      for (let i = 0; i < texts.length; i += MAX_BATCH) {
        const chunk = texts.slice(i, i + MAX_BATCH);
        const part = await this.embedBatch(chunk);
        out.push(...part);
      }
      return out;
    }

    const url = `${GEMINI_BASE}/${MODEL}:batchEmbedContents?key=${this.apiKey}`;
    const body = {
      requests: texts.map((text) => ({
        model: MODEL,
        content: { parts: [{ text }] },
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: DIMENSIONS, // Matryoshka truncation → 768
      })),
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini batch embed failed (${res.status}): ${errText}`);
    }
    const data = (await res.json()) as {
      embeddings: { values: number[] }[];
    };
    return data.embeddings.map((e) => e.values);
  }
}
