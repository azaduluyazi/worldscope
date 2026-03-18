"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[WorldScope Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-hud-base flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-6">
        {/* Alert icon */}
        <div className="relative w-20 h-20 mx-auto">
          <div
            className="absolute inset-0 border-2 border-severity-critical/40 rounded-full animate-ping"
            style={{ animationDuration: "2s" }}
          />
          <div className="absolute inset-0 border-2 border-severity-critical/60 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">⚠</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-mono text-xs text-severity-critical tracking-wider font-bold">
            SYSTEM MALFUNCTION
          </p>
          <p className="font-mono text-sm text-hud-muted">
            An unexpected error occurred in the intelligence pipeline.
            <br />
            Our systems are attempting recovery.
          </p>
          {error.digest && (
            <p className="font-mono text-[9px] text-hud-muted/50">
              ERROR ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="font-mono text-xs text-hud-accent border border-hud-accent/30 px-4 py-2 rounded hover:bg-hud-accent/10 transition-colors"
          >
            ↻ RETRY OPERATION
          </button>
          <button
            onClick={() => window.location.href = "/"}
            className="font-mono text-xs text-hud-muted border border-hud-border px-4 py-2 rounded hover:bg-hud-panel transition-colors"
          >
            ← RETURN TO HQ
          </button>
        </div>

        {/* Decorative */}
        <div className="pt-6">
          <div className="h-px bg-gradient-to-r from-transparent via-severity-critical/30 to-transparent" />
          <p className="font-mono text-[9px] text-hud-muted/50 mt-2 tracking-widest">
            WORLDSCOPE // ERROR HANDLER ACTIVE
          </p>
        </div>
      </div>
    </div>
  );
}
