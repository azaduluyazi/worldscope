"use client";

import { useBreakingAlert } from "@/hooks/useBreakingAlert";
import { SEVERITY_COLORS } from "@/types/intel";

/**
 * Floating toast notification for CRITICAL severity events.
 * Appears at top-right, auto-dismisses after 8 seconds.
 */
export function BreakingToast() {
  const { latestAlert, showToast, dismissToast, requestPermission, notificationsEnabled } =
    useBreakingAlert();

  if (!showToast || !latestAlert) return null;

  return (
    <div className="fixed top-14 right-4 z-[300] max-w-sm animate-slideUp">
      <div className="bg-hud-panel border border-severity-critical/50 rounded-lg shadow-lg shadow-severity-critical/20 overflow-hidden">
        {/* Red accent bar */}
        <div
          className="h-1 animate-pulse"
          style={{ backgroundColor: SEVERITY_COLORS.critical }}
        />

        <div className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[9px] font-bold tracking-wider text-severity-critical animate-pulse">
              CRITICAL ALERT
            </span>
            <button
              onClick={dismissToast}
              className="text-hud-muted hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <p className="text-[11px] text-white leading-snug mb-2">
            {latestAlert.title}
          </p>

          <div className="flex items-center justify-between">
            <span className="font-mono text-[7px] text-hud-muted">
              {latestAlert.source} — {latestAlert.category.toUpperCase()}
            </span>

            {!notificationsEnabled && (
              <button
                onClick={requestPermission}
                className="font-mono text-[7px] text-hud-accent hover:underline"
              >
                ENABLE NOTIFICATIONS
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
