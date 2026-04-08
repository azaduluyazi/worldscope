import type { EmbeddingProvider } from "./provider";

// ═══════════════════════════════════════════════════════════════════
//  Gemini text-embedding-004 provider
// ═══════════════════════════════════════════════════════════════════
//
//  Free tier: 1500 requests/minute. WorldScope's expected hourly load
//  (~150 events × 1 embedding each = 150/hr) sits comfortably inside.
//
//  Endpoint:
//    POST https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent
//    POST https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents
//
//  Auth: ?key={GEMINI_API_KEY} query parameter
//  Output dimensions: 768
// ═══════════════════════════════════════════════════════════════════

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = "models/text-embedding-004";
const DIMENSIONS = 768;
const MAX_BATCH = 100; // Gemini batch limit

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly name = "gemini-text-embedding-004";
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
