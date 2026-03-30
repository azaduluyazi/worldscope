"use client";

import { useState, useCallback } from "react";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationEnabled,
  setNotificationEnabled,
  sendNotification,
} from "@/lib/notifications/browser-push";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import type { IntelItem } from "@/types/intel";

export function NotificationBell() {
  const [enabled, setEnabled] = useState(() => isNotificationEnabled());
  const [permission, setPermission] = useState(() => getNotificationPermission());
  const [supported, setSupported] = useState(() => isNotificationSupported());

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
