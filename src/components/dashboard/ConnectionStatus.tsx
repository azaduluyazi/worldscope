"use client";

import { useState, useEffect, useRef } from "react";

/**
 * ConnectionStatus — monitors browser connectivity + SSE stream health.
 *
 * Improvements over previous version:
 * - Exponential backoff on SSE reconnect (5s → 10s → 20s → max 60s)
 * - Backoff resets on successful connection
 * - Softer UX messaging ("Syncing..." instead of aggressive "OFFLINE")
 * - Auto-hide SSE banner after 3 failed attempts (data still flows via SWR polling)
 * - Only shows offline banner for actual network loss
 */
const MAX_RECONNECT_DELAY = 60_000;
const INITIAL_RECONNECT_DELAY = 5_000;
const HIDE_AFTER_RETRIES = 3; // hide SSE banner after N retries (SWR still fetches)

export function ConnectionStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [sseConnected, setSseConnected] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);

  // Browser online/offline
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // SSE connection with exponential backoff
  useEffect(() => {
    if (!online) return;

    let disposed = false;

    const connect = () => {
      if (disposed) return;
      const es = new EventSource("/api/intel/stream");
      esRef.current = es;

      es.onopen = () => {
        setSseConnected(true);
        setRetryCount(0);
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY; // reset backoff
      };

      es.addEventListener("intel", () => {
        setEventCount((c) => c + 1);
      });

      es.onerror = () => {
        setSseConnected(false);
        es.close();
        setRetryCount((c) => c + 1);

        // Exponential backoff: 5s → 10s → 20s → 40s → 60s (max)
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);

        setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      disposed = true;
      esRef.current?.close();
    };
  }, [online]);

  // Show nothing when fully connected
  if (online && sseConnected) return null;

  // Offline banner — only on actual network loss
  if (!online) {
    return (
      <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-severity-critical/90 text-white font-mono text-[10px] px-4 py-2 rounded-md shadow-lg flex items-center gap-2 animate-pulse">
        <span>⚠</span>
        <span>CONNECTION LOST — Cached data shown</span>
      </div>
    );
  }

  // After N retries, hide the banner — SWR polling still provides data
  if (retryCount >= HIDE_AFTER_RETRIES) return null;

  // Online but SSE reconnecting — soft messaging
  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-hud-panel/90 text-hud-accent font-mono text-[10px] px-4 py-2 rounded-md shadow-lg flex items-center gap-2 border border-hud-border backdrop-blur-sm">
      <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
      <span>
        Syncing live feed...{eventCount > 0 && ` (${eventCount} events)`}
      </span>
    </div>
  );
}
