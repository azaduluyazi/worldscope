"use client";

import { useState, useEffect, useRef } from "react";

export function ConnectionStatus() {
  const [online, setOnline] = useState(true);
  const [sseConnected, setSseConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  // Browser online/offline
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // SSE connection monitoring
  useEffect(() => {
    if (!online) return;

    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      const es = new EventSource("/api/intel/stream");
      esRef.current = es;

      es.onopen = () => setSseConnected(true);

      es.addEventListener("intel", () => {
        setLastEvent(new Date().toISOString());
        setEventCount(c => c + 1);
      });

      es.onerror = () => {
        setSseConnected(false);
        es.close();
        // Reconnect after 5 seconds
        reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      esRef.current?.close();
    };
  }, [online]);

  // Show nothing when fully connected
  if (online && sseConnected) return null;

  // Offline banner
  if (!online) {
    return (
      <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-severity-critical/90 text-white font-mono text-[10px] px-4 py-2 rounded-md shadow-lg flex items-center gap-2 animate-pulse">
        <span>⚠</span>
        <span>OFFLINE — Data may be stale</span>
      </div>
    );
  }

  // Online but SSE disconnected
  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-hud-panel/90 text-hud-accent font-mono text-[10px] px-4 py-2 rounded-md shadow-lg flex items-center gap-2 border border-hud-border backdrop-blur-sm">
      <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
      <span>RECONNECTING — {eventCount} events received</span>
    </div>
  );
}
