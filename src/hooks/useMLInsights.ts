/**
 * useMLInsights — React hook for browser-side ML analysis.
 *
 * Runs sentiment analysis, NER, and clustering on intel headlines
 * entirely in the browser via Web Worker + Transformers.js.
 * Zero API cost — models cached in IndexedDB after first load.
 *
 * Usage:
 *   const { sentiment, entities, clusters, isProcessing } = useMLInsights(headlines);
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { SentimentScore, NEREntity, TextCluster } from "@/lib/ml/types";

interface MLInsights {
  sentiment: SentimentScore[];
  entities: NEREntity[][];
  clusters: TextCluster[];
  isProcessing: boolean;
  isReady: boolean;
  error: string | null;
  /** Manually re-run analysis on current texts */
  refresh: () => void;
}

/**
 * Analyze headlines with browser-side ML.
 *
 * @param texts - Array of headline strings to analyze
 * @param options.enabled - Enable/disable ML processing (default: true)
 * @param options.debounceMs - Debounce interval for text changes (default: 1000)
 * @param options.maxTexts - Max texts to process per batch (default: 50)
 */
export function useMLInsights(
  texts: string[],
  options?: { enabled?: boolean; debounceMs?: number; maxTexts?: number }
): MLInsights {
  const { enabled = true, debounceMs = 1000, maxTexts = 50 } = options ?? {};

  const [sentiment, setSentiment] = useState<SentimentScore[]>([]);
  const [entities, setEntities] = useState<NEREntity[][]>([]);
  const [clusters, setClusters] = useState<TextCluster[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lazy-load MLClient only when needed (code-split)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const analyze = useCallback(async (inputTexts: string[]) => {
    if (!enabled || inputTexts.length === 0) return;

    try {
      // Dynamic import — MLClient only loaded when first used
      if (!clientRef.current) {
        const { MLClient } = await import("@/lib/ml/client");
        clientRef.current = MLClient.getInstance();
        if (!clientRef.current.ready) {
          setError("ML Worker not available in this browser");
          return;
        }
        setIsReady(true);
      }

      const ml = clientRef.current;
      const batch = inputTexts.slice(0, maxTexts);

      setIsProcessing(true);
      setError(null);

      // Run all three tasks in parallel
      const [sentimentResults, nerResults, clusterResults] = await Promise.allSettled([
        ml.sentiment(batch),
        ml.ner(batch.slice(0, 20)), // NER is slower — limit to 20
        ml.cluster(batch, 0.65),
      ]);

      if (sentimentResults.status === "fulfilled") {
        setSentiment(sentimentResults.value);
      }
      if (nerResults.status === "fulfilled") {
        setEntities(nerResults.value);
      }
      if (clusterResults.status === "fulfilled") {
        setClusters(clusterResults.value);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "ML processing failed");
    } finally {
      setIsProcessing(false);
    }
  }, [enabled, maxTexts]);

  // Debounced analysis when texts change
  useEffect(() => {
    if (!enabled || texts.length === 0) return;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      analyze(texts);
    }, debounceMs);

    return () => clearTimeout(timerRef.current);
  }, [texts, enabled, debounceMs, analyze]);

  const refresh = useCallback(() => {
    analyze(texts);
  }, [analyze, texts]);

  return { sentiment, entities, clusters, isProcessing, isReady, error, refresh };
}
