"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useIntelFeed } from "./useIntelFeed";
import { useAlertRules } from "./useAlertRules";
import type { IntelItem } from "@/types/intel";

/**
 * Play a tactical alert sound.
 * Deferred via requestAnimationFrame to avoid blocking main thread.
 */
function playAlertSound() {
  requestAnimationFrame(() => {
    try {
      const ctx = new AudioContext();
      const frequencies = [880, 660, 440]; // A5 → E5 → A4
      const duration = 0.15;
      const gap = 0.08;

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = freq;
        gain.gain.value = 0.15;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (i * (duration + gap)) + duration);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + i * (duration + gap));
        osc.stop(ctx.currentTime + (i * (duration + gap)) + duration);
      });

      setTimeout(() => ctx.close(), 1000);
    } catch {}
  });
}

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
  const { matchesRules } = useAlertRules();
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState((s) => ({
        ...s,
        notificationsEnabled: Notification.permission === "granted",
      }));
    }
  }, []);

  // Monitor for new critical events + custom alert rules
  useEffect(() => {
    const criticalItems = items.filter((item) => item.severity === "critical");

    const newAlerts: IntelItem[] = [];
    for (const item of criticalItems) {
      if (!seenIdsRef.current.has(item.id)) {
        seenIdsRef.current.add(item.id);
        newAlerts.push(item);
      }
    }

    // Also check custom alert rules for non-critical items
    for (const item of items) {
      if (seenIdsRef.current.has(item.id)) continue;
      if (item.severity === "critical") continue; // already handled above
      const matchedRule = matchesRules(item);
      if (matchedRule) {
        seenIdsRef.current.add(item.id);
        newAlerts.push(item);
      }
    }

    if (newAlerts.length === 0) return;

    const latest = newAlerts[0];

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => ({
      ...s,
      alerts: [...newAlerts, ...s.alerts].slice(0, 20),
      latestAlert: latest,
      showToast: true,
    }));

    // Play tactical alert sound
    playAlertSound();

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
  }, [items, state.notificationsEnabled, matchesRules]);

  const dismissToast = useCallback(() => {
    setState((s) => ({ ...s, showToast: false }));
  }, []);

  return {
    ...state,
    requestPermission,
    dismissToast,
  };
}
