/**
 * Browser-Side ML Module
 *
 * Zero-cost AI processing using Transformers.js in a Web Worker.
 * Models: DistilBERT (sentiment), BERT-NER (entities), MiniLM-L6 (embeddings).
 *
 * Usage:
 *   import { MLClient } from "@/lib/ml";
 *   const ml = MLClient.getInstance();
 *   const results = await ml.sentiment(["headline1", "headline2"]);
 */

export { MLClient } from "./client";
export type {
  MLRequest,
  MLResponse,
  MLTaskType,
  SentimentScore,
  NEREntity,
  TextCluster,
} from "./types";
