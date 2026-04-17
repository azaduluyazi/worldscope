"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationEnabled,
  setNotificationEnabled,
  sendNotification,
  subscribeNotificationState,
} from "@/lib/notifications/browser-push";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import type { IntelItem } from "@/types/intel";

// SSR-safe subscriptions via useSyncExternalStore — keeps hydration clean.
const noopSubscribe = () => () => {};

export function NotificationBell() {
  const supported = useSyncExternalStore(
    noopSubscribe,
    isNotificationSupported,
    () => false
  );
  const enabled = useSyncExternalStore(
    subscribeNotificationState,
    isNotificationEnabled,
    () => false
  );
  const permission = useSyncExternalStore(
    noopSubscribe,
    getNotificationPermission,
    () => "default" as const
  );

  // Local setter kept for the toggle handler flow; writes propagate via
  // subscribeNotificationState so this component (and any siblings) re-render.
  const setEnabled = (v: boolean) => setNotificationEnabled(v);
  const setPermission = (_v: NotificationPermission) => {
    // Permission is a browser state — no dispatcher needed beyond a re-render
    // which happens via realtime events below. Kept as no-op for flow parity.
  };

  const handleToggle = useCallback(async () => {
    if (!supported) return;

    if (!enabled) {
      const perm = await requestNotificationPermission();
      setPermission(perm);
      if (perm === "granted") {
        setEnabled(true);
        setNotificationEnabled(true);
        sendNotification("WorldScope Alerts Enabled", {
          body: "You'll receive notifications for critical intelligence events.",
          severity: "info",
        });
      }
    } else {
      setEnabled(false);
      setNotificationEnabled(false);
    }
  }, [enabled, supported]);

  // Listen to realtime events and push notifications for critical/high
  useRealtimeEvents(useCallback((item: IntelItem) => {
    if (!enabled || !isNotificationEnabled()) return;
    if (item.severity !== "critical" && item.severity !== "high") return;

    sendNotification(item.title.slice(0, 100), {
      body: `${item.category.toUpperCase()} | ${item.source}`,
      severity: item.severity,
      url: item.url,
      tag: `ws-${item.id}`,
    });
  }, [enabled]));

  if (!supported) return null;

  return (
    <button
      onClick={handleToggle}
      title={
        permission === "denied"
          ? "Notifications blocked by browser"
          : enabled
          ? "Disable alerts"
          : "Enable breaking alerts"
      }
      className={`w-7 h-7 rounded-md flex items-center justify-center text-sm transition-all ${
        enabled
          ? "bg-severity-critical/15 border border-severity-critical/30"
          : "bg-hud-panel border border-hud-border hover:border-hud-muted"
      } ${permission === "denied" ? "opacity-30 cursor-not-allowed" : ""}`}
      disabled={permission === "denied"}
    >
      {enabled ? "🔔" : "🔕"}
    </button>
  );
}
