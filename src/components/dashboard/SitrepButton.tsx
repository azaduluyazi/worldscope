"use client";

import { useState, useCallback } from "react";

/**
 * SitrepButton — Generates an on-demand AI situation report.
 *
 * Click → streams SITREP from /api/ai/sitrep → displays in modal.
 * Can be parameterized by region, topic, or category.
 */

interface SitrepButtonProps {
  /** Filter: country code or region name */
  region?: string;
  /** Filter: specific topic */
  topic?: string;
  /** Filter: event category */
  category?: string;
  /** Lookback hours (default 48) */
  hours?: number;
  /** Language */
  lang?: "en" | "tr";
  /** Button label override */
  label?: string;
  className?: string;
}

export function SitrepButton({
  region,
  topic,
  category,
  hours = 48,
  lang = "en",
  label = "Generate SITREP",
  className = "",
}: SitrepButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [content, setContent] = useState("");
  const [showModal, setShowModal] = useState(false);

  const generate = useCallback(async () => {
    setState("loading");
    setContent("");
    setShowModal(true);

    try {
      const res = await fetch("/api/ai/sitrep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, topic, category, hours, lang }),
      });

      if (!res.ok || !res.body) {
        setState("idle");
        setContent("Failed to generate SITREP. Please try again.");
        return;
      }

      // Stream response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setContent(text);
      }

      setState("done");
    } catch {
      setState("idle");
      setContent("Error generating SITREP.");
    }
  }, [region, topic, category, hours, lang]);

  return (
    <>
      <button
        onClick={generate}
        disabled={state === "loading"}
        className={`font-mono text-[9px] px-2.5 py-1.5 rounded border border-hud-accent/50 bg-hud-accent/10 text-hud-accent hover:bg-hud-accent/20 transition-colors disabled:opacity-50 ${className}`}
      >
        {state === "loading" ? "GENERATING..." : `📋 ${label}`}
      </button>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[300] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-hud-base border border-hud-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-hud-border">
              <div>
                <span className="font-mono text-[10px] text-hud-accent font-bold tracking-wider">
                  SITUATION REPORT
                </span>
                {(region || topic) && (
                  <span className="font-mono text-[9px] text-hud-muted ml-2">
                    {[region, topic, category].filter(Boolean).join(" / ")}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-hud-muted hover:text-hud-text text-lg"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {state === "loading" && !content && (
                <div className="flex items-center gap-2 text-hud-muted font-mono text-xs">
                  <span className="animate-pulse">●</span> Analyzing intelligence data...
                </div>
              )}
              <div
                className="prose prose-invert prose-sm max-w-none
                  prose-headings:font-mono prose-headings:text-hud-accent prose-headings:text-xs
                  prose-p:text-hud-muted prose-p:text-[11px] prose-p:leading-relaxed
                  prose-li:text-hud-muted prose-li:text-[11px]
                  prose-strong:text-hud-text
                  whitespace-pre-wrap font-mono text-[11px] text-hud-muted leading-relaxed"
              >
                {content}
              </div>
            </div>

            {/* Footer */}
            {state === "done" && (
              <div className="px-4 py-2 border-t border-hud-border flex justify-end gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(content);
                  }}
                  className="font-mono text-[9px] px-3 py-1.5 rounded border border-hud-border text-hud-muted hover:text-hud-accent hover:border-hud-accent/50 transition-colors"
                >
                  📋 Copy
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="font-mono text-[9px] px-3 py-1.5 rounded bg-hud-accent/20 border border-hud-accent/50 text-hud-accent hover:bg-hud-accent/30 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
