/**
 * ML Client — Main-thread interface to the ML Web Worker.
 *
 * Usage:
 *   const ml = MLClient.getInstance();
 *   const sentiments = await ml.sentiment(["Great news!", "War declared"]);
 *   const entities = await ml.ner(["NATO deployed troops to Poland"]);
 *   const clusters = await ml.cluster(headlines, 0.65);
 */

import type {
  MLRequest,
  MLResponse,
  MLTaskType,
  SentimentScore,
  NEREntity,
  TextCluster,
} from "./types";

type PendingRequest = {
  resolve: (value: MLResponse) => void;
  reject: (error: Error) => void;
};

export class MLClient {
  private static instance: MLClient | null = null;
  private worker: Worker | null = null;
  private pending = new Map<string, PendingRequest>();
  private requestCounter = 0;
  private _ready = false;

  private constructor() {
    if (typeof window === "undefined") return; // SSR guard
    try {
      this.worker = new Worker(
        new URL("./worker.ts", import.meta.url),
        { type: "module" }
      );
      this.worker.onmessage = this.handleMessage.bind(this);
      this.worker.onerror = this.handleError.bind(this);
      this._ready = true;
    } catch {
      console.warn("[ML] Web Worker not supported in this environment");
    }
  }

  static getInstance(): MLClient {
    if (!MLClient.instance) {
      MLClient.instance = new MLClient();
    }
    return MLClient.instance;
  }

  get ready(): boolean {
    return this._ready;
  }

  private generateId(): string {
    return `ml-${++this.requestCounter}-${Date.now()}`;
  }

  private handleMessage(event: MessageEvent<MLResponse>): void {
    const { id } = event.data;
    const pending = this.pending.get(id);
    if (pending) {
      this.pending.delete(id);
      if (event.data.error) {
        pending.reject(new Error(event.data.error));
      } else {
        pending.resolve(event.data);
      }
    }
  }

  private handleError(event: ErrorEvent): void {
    console.error("[ML] Worker error:", event.message);
    // Reject all pending requests
    for (const [id, pending] of this.pending) {
      pending.reject(new Error(`Worker error: ${event.message}`));
      this.pending.delete(id);
    }
  }

  private send(task: MLTaskType, texts: string[], options?: MLRequest["options"]): Promise<MLResponse> {
    if (!this.worker) {
      return Promise.reject(new Error("ML Worker not available"));
    }

    const id = this.generateId();
    const request: MLRequest = { id, task, texts, options };

    return new Promise((resolve, reject) => {
      // Timeout after 60s (model loading can be slow first time)
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`ML task '${task}' timed out after 60s`));
      }, 60_000);

      this.pending.set(id, {
        resolve: (value) => { clearTimeout(timer); resolve(value); },
        reject: (error) => { clearTimeout(timer); reject(error); },
      });

      this.worker!.postMessage(request);
    });
  }

  /** Analyze sentiment of texts. Returns label + confidence per text. */
  async sentiment(texts: string[]): Promise<SentimentScore[]> {
    if (texts.length === 0) return [];
    const response = await this.send("sentiment", texts);
    return (response.results as SentimentScore[]) || [];
  }

  /** Extract named entities (PER/ORG/LOC/MISC) from texts. */
  async ner(texts: string[]): Promise<NEREntity[][]> {
    if (texts.length === 0) return [];
    const response = await this.send("ner", texts);
    return (response.results as NEREntity[][]) || [];
  }

  /** Generate 384-dim embeddings for texts (MiniLM-L6). */
  async embeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const response = await this.send("embeddings", texts);
    return (response.results as number[][]) || [];
  }

  /** Cluster similar texts together using cosine similarity. */
  async cluster(texts: string[], threshold = 0.65): Promise<TextCluster[]> {
    if (texts.length === 0) return [];
    const response = await this.send("cluster", texts, { threshold });
    return (response.results as TextCluster[]) || [];
  }

  /** Check which models are loaded. */
  async status(): Promise<MLResponse["status"]> {
    const response = await this.send("status", []);
    return response.status;
  }

  /** Terminate the worker (cleanup). */
  destroy(): void {
    this.worker?.terminate();
    this.worker = null;
    this._ready = false;
    MLClient.instance = null;
  }
}
