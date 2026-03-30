/**
 * ML Web Worker — runs Transformers.js models in a background thread.
 *
 * Supports: sentiment analysis, NER, text embeddings, headline clustering.
 * Models are downloaded once and cached in IndexedDB (~50MB total).
 * Subsequent loads are instant from cache.
 *
 * Architecture:
 *   Main thread → postMessage(MLRequest) → Worker processes → postMessage(MLResponse)
 */

import {
  pipeline,
  env,
  type TextClassificationPipeline,
  type TokenClassificationPipeline,
  type FeatureExtractionPipeline,
} from "@huggingface/transformers";
import type { MLRequest, MLResponse, SentimentScore, NEREntity, TextCluster } from "./types";

// Configure transformers.js for browser
env.allowLocalModels = false;
// Models cached in IndexedDB automatically

/* ─── Model Singletons (lazy-loaded) ─── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sentimentPipeline: TextClassificationPipeline | any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nerPipeline: TokenClassificationPipeline | any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let embeddingPipeline: FeatureExtractionPipeline | any = null;
const loadedModels: string[] = [];

async function getSentimentPipeline() {
  if (!sentimentPipeline) {
    sentimentPipeline = await pipeline(
      "text-classification",
      "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
      { dtype: "q8" }
    );
    loadedModels.push("sentiment");
  }
  return sentimentPipeline;
}

async function getNerPipeline() {
  if (!nerPipeline) {
    nerPipeline = await pipeline(
      "token-classification",
      "Xenova/bert-base-NER",
      { dtype: "q8" }
    );
    loadedModels.push("ner");
  }
  return nerPipeline;
}

async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
      { dtype: "q8" }
    );
    loadedModels.push("embeddings");
  }
  return embeddingPipeline;
}

/* ─── Task Handlers ─── */

async function handleSentiment(texts: string[]): Promise<SentimentScore[]> {
  const pipe = await getSentimentPipeline();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: any[] = await pipe(texts, { topk: 1 });

  return results.map((r) => {
    // Pipeline returns [{label, score}] or {label, score}
    const item = Array.isArray(r) ? r[0] : r;
    const label = item.label.toLowerCase();
    return {
      label: label === "positive" ? "positive" : label === "negative" ? "negative" : "neutral",
      score: Math.round(item.score * 1000) / 1000,
    } as SentimentScore;
  });
}

async function handleNer(texts: string[]): Promise<NEREntity[][]> {
  const pipe = await getNerPipeline();
  const allResults: NEREntity[][] = [];

  for (const text of texts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entities: any[] = await pipe(text);
    // Merge sub-word tokens (B-PER, I-PER → single entity)
    const merged: NEREntity[] = [];
    let current: NEREntity | null = null;

    for (const ent of entities) {
      const tag = ent.entity || ent.entity_group || "";
      const prefix = tag.charAt(0); // B or I
      const type = tag.replace(/^[BI]-/, "") as NEREntity["type"];

      if (prefix === "B" || !current || current.type !== type) {
        if (current) merged.push(current);
        current = {
          text: ent.word.replace(/^##/, ""),
          type,
          score: ent.score,
          start: ent.start ?? 0,
          end: ent.end ?? 0,
        };
      } else {
        // Continue token — append to current
        current.text += ent.word.replace(/^##/, "");
        current.end = ent.end ?? current.end;
        current.score = Math.min(current.score, ent.score);
      }
    }
    if (current) merged.push(current);

    // Filter low-confidence entities
    allResults.push(merged.filter((e) => e.score > 0.5));
  }

  return allResults;
}

async function handleEmbeddings(texts: string[]): Promise<number[][]> {
  const pipe = await getEmbeddingPipeline();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output: any = await pipe(texts, { pooling: "mean", normalize: true });

  // Output is a Tensor — convert to array
  const embeddings: number[][] = [];
  for (let i = 0; i < texts.length; i++) {
    embeddings.push(Array.from(output[i].data || output.data.slice(i * 384, (i + 1) * 384)));
  }
  return embeddings;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}

async function handleCluster(
  texts: string[],
  threshold = 0.65
): Promise<TextCluster[]> {
  if (texts.length === 0) return [];

  const embeddings = await handleEmbeddings(texts);
  const assigned = new Set<number>();
  const clusters: TextCluster[] = [];

  for (let i = 0; i < texts.length; i++) {
    if (assigned.has(i)) continue;

    const cluster: TextCluster = {
      id: clusters.length,
      centroidText: texts[i],
      members: [{ text: texts[i], similarity: 1.0 }],
      size: 1,
    };
    assigned.add(i);

    // Find similar texts
    for (let j = i + 1; j < texts.length; j++) {
      if (assigned.has(j)) continue;
      const sim = cosineSimilarity(embeddings[i], embeddings[j]);
      if (sim >= threshold) {
        cluster.members.push({ text: texts[j], similarity: Math.round(sim * 1000) / 1000 });
        cluster.size++;
        assigned.add(j);
      }
    }

    clusters.push(cluster);
  }

  // Sort by size descending
  return clusters.sort((a, b) => b.size - a.size);
}

/* ─── Message Handler ─── */

self.onmessage = async (event: MessageEvent<MLRequest>) => {
  const { id, task, texts, options } = event.data;
  const start = performance.now();

  try {
    let results: MLResponse["results"];

    switch (task) {
      case "sentiment":
        results = await handleSentiment(texts);
        break;
      case "ner":
        results = await handleNer(texts);
        break;
      case "embeddings":
        results = await handleEmbeddings(texts);
        break;
      case "cluster":
        results = await handleCluster(texts, options?.threshold);
        break;
      case "status":
        self.postMessage({
          id,
          task: "status",
          durationMs: 0,
          status: { loaded: loadedModels.length > 0, modelsReady: [...loadedModels] },
        } satisfies MLResponse);
        return;
      default:
        throw new Error(`Unknown task: ${task}`);
    }

    self.postMessage({
      id,
      task,
      results,
      durationMs: Math.round(performance.now() - start),
    } satisfies MLResponse);
  } catch (err) {
    self.postMessage({
      id,
      task,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Math.round(performance.now() - start),
    } satisfies MLResponse);
  }
};
