"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useIntelFeed } from "./useIntelFeed";
import type { IntelItem } from "@/types/intel";

// Short alert beep as base64 (tiny sine wave)
const ALERT_BEEP_B64 =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

interface BreakingAlertState {
  alerts: IntelItem[];
  latestAlert: IntelItem | null;
  showToast: boolean;
  notificationsEnabled: boolean;
}

/**
 * Monitor intel feed for CRITICAL severity events.
 * Triggers toast notification + optional browser notification + sound.
 */
export function useBreakingAlert() {
  const { items } = useIntelFeed();
  const seenIdsRef = useRef(new Set<string>());
  const [state, setState] = useState<BreakingAlertState>({
    alerts: [],
    latestAlert: null,
    showToast: false,
    notificationsEnabled: false,
  });

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setState((s) => ({ ...s, notificationsEnabled: result === "granted" }));
  }, []);

  // Check permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setState((s) => ({
        ...s,
        notificationsEnabled: Notification.permission === "granted",
      }));
    }
  }, []);

  // Monitor for new critical events
  useEffect(() => {
    const criticalItems = items.filter((item) => item.severity === "critical");

    const newAlerts: IntelItem[] = [];
    for (const item of criticalItems) {
      if (!seenIdsRef.current.has(item.id)) {
        seenIdsRef.current.add(item.id);
        newAlerts.push(item);
      }
    }

    if (newAlerts.length === 0) return;

    const latest = newAlerts[0];

    setState((s) => ({
      ...s,
      alerts: [...newAlerts, ...s.alerts].slice(0, 20),
      latestAlert: latest,
      showToast: true,
    }));

    // Play alert sound
    try {
      const audio = new Audio(ALERT_BEEP_B64);
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}

    // Browser notification
    if (state.notificationsEnabled && typeof Notification !== "undefined") {
      try {
        new Notification("WORLDSCOPE ALERT", {
          body: latest.title,
          icon: "/icons/icon-192x192.png",
          tag: latest.id,
          requireInteraction: false,
        });
      } catch {}
    }

    // Auto-dismiss toast after 8 seconds
    const timer = setTimeout(() => {
      setState((s) => ({ ...s, showToast: false }));
    }, 8000);

    return () => clearTimeout(timer);
  }, [items, state.notificationsEnabled]);

  const dismissToast = useCallback(() => {
    setState((s) => ({ ...s, showToast: false }));
  }, []);

  return {
    ...state,
    requestPermission,
    dismissToast,
  };
}
