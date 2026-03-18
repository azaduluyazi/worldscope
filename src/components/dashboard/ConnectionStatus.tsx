"use client";

import { useState, useEffect } from "react";

export function ConnectionStatus() {
  const [online, setOnline] = useState(true);

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

  if (online) return null;

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-severity-critical/90 text-white font-mono text-[10px] px-4 py-2 rounded-md shadow-lg flex items-center gap-2 animate-pulse">
      <span>⚠</span>
      <span>OFFLINE — Data may be stale</span>
    </div>
  );
}
