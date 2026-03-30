/**
 * Browser-Side ML Types — shared between worker and main thread.
 */

export type MLTaskType = "sentiment" | "ner" | "embeddings" | "cluster" | "status";

export interface MLRequest {
  id: string;
  task: MLTaskType;
  texts: string[];
  options?: {
    /** Number of clusters for clustering task */
    k?: number;
    /** Similarity threshold for clustering (0-1) */
    threshold?: number;
  };
}

export interface SentimentScore {
  label: "positive" | "negative" | "neutral";
  score: number; // 0-1 confidence
}

export interface NEREntity {
  text: string;
  type: "PER" | "ORG" | "LOC" | "MISC";
  score: number;
  start: number;
  end: number;
}

export interface TextCluster {
  id: number;
  centroidText: string;
  members: Array<{ text: string; similarity: number }>;
  size: number;
}

export interface MLResponse {
  id: string;
  task: MLTaskType;
  results?: SentimentScore[] | NEREntity[][] | TextCluster[] | number[][];
  error?: string;
  durationMs: number;
  /** Model loading status */
  status?: {
    loaded: boolean;
    modelsReady: string[];
    progress?: number;
  };
}
