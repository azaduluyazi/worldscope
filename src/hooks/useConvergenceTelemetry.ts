"use client";

import { useCallback, useRef } from "react";
import type { Convergence } from "@/lib/convergence/types";
import type { TelemetryEvent } from "@/lib/convergence/telemetry";

// ═══════════════════════════════════════════════════════════════════
//  useConvergenceTelemetry — fire-and-forget client telemetry
// ═══════════════════════════════════════════════════════════════════
//
//  Records "shown / clicked / dismissed / expanded / shared / feedback"
//  events to /api/convergence/telemetry without blocking the UI.
//
//  Behaviors:
//    - Each "shown" event is fired AT MOST ONCE per (convergence,
//      surface) per session — uses a session-scoped Set to dedup.
//    - Network failures are silently ignored (telemetry must NEVER
//      break the UX).
//    - Surface tag distinguishes panel/email/mobile/etc.
//    - Uses navigator.sendBeacon when available so events still fire
//      on page unload.
// ═══════════════════════════════════════════════════════════════════

const ENDPOINT = "/api/convergence/telemetry";

interface UseTelemetryOptions {
  surface: string; // "panel" | "email" | "globe" | "mobile"
  userId?: string;
}

export function useConvergenceTelemetry({ surface, userId }: UseTelemetryOptions) {
  // Session-scoped dedup for "shown" events so we don't spam writes
  // when SWR re-renders the panel.
  const shownRef = useRef<Set<string>>(new Set());

  const post = useCallback((payload: object) => {
    const body = JSON.stringify(payload);
    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(ENDPOINT, blob);
        return;
      }
    } catch {
      // Fall through to fetch
    }
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* swallow */
    });
  }, []);

  const buildPayload = useCallback(
    (conv: Convergence, event: TelemetryEvent) => ({
      convergenceId: conv.id,
      event,
      confidence: conv.confidence,
      type: conv.type,
      categoryCount: new Set(conv.signals.map((s) => s.category)).size,
      signalCount: conv.signals.length,
      hasNarrative: !!conv.narrative,
      predictionsValidated:
        conv.predictions?.filter((p) => p.validated).length ?? 0,
      userId,
      timestamp: new Date().toISOString(),
      surface,
    }),
    [surface, userId]
  );

  const trackShown = useCallback(
    (conv: Convergence) => {
      const key = `${conv.id}::${surface}`;
      if (shownRef.current.has(key)) return;
      shownRef.current.add(key);
      post(buildPayload(conv, "shown"));
    },
    [buildPayload, post, surface]
  );

  const trackClick = useCallback(
    (conv: Convergence) => post(buildPayload(conv, "clicked")),
    [buildPayload, post]
  );

  const trackExpand = useCallback(
    (conv: Convergence) => post(buildPayload(conv, "expanded")),
    [buildPayload, post]
  );

  const trackDismiss = useCallback(
    (conv: Convergence) => post(buildPayload(conv, "dismissed")),
    [buildPayload, post]
  );

  const trackShare = useCallback(
    (conv: Convergence) => post(buildPayload(conv, "shared")),
    [buildPayload, post]
  );

  const trackFeedbackPos = useCallback(
    (conv: Convergence) => post(buildPayload(conv, "feedback_pos")),
    [buildPayload, post]
  );

  const trackFeedbackNeg = useCallback(
    (conv: Convergence) => post(buildPayload(conv, "feedback_neg")),
    [buildPayload, post]
  );

  return {
    trackShown,
    trackClick,
    trackExpand,
    trackDismiss,
    trackShare,
    trackFeedbackPos,
    trackFeedbackNeg,
  };
}
