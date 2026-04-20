"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/shared/ThemeProvider";

interface NeonBreakingBannerProps {
  /** Single critical alert title; rotation kicks in when the page passes more */
  text?: string;
  /** Optional list of critical titles to rotate through every 6s */
  rotation?: string[];
}

/**
 * Theme-adaptive critical alert banner — A2 mockup port.
 *
 * Renders a full-width gradient bar above the TopBar whenever the active
 * theme sets gradientBanner=true. The gradient itself comes from the
 * `--banner-gradient` CSS variable defined per-theme in tactical.css, so
 * the same component is amber+red in warroom and magenta+pink in
 * cyberpunk without branching in JSX.
 *
 * When `rotation` is provided, the visible message fades through the list
 * every ~6s to surface multiple live tier-1 alerts without stacking banners.
 */
export function NeonBreakingBanner({ text, rotation }: NeonBreakingBannerProps) {
  const { theme } = useTheme();
  const candidates = rotation && rotation.length > 0 ? rotation : text ? [text] : [];
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (candidates.length <= 1) return;
    const id = setInterval(() => {
      setFade(false);
      const swap = window.setTimeout(() => {
        setIdx((i) => (i + 1) % candidates.length);
        setFade(true);
      }, 240);
      return () => window.clearTimeout(swap);
    }, 6000);
    return () => clearInterval(id);
  }, [candidates.length]);

  const visible =
    theme.gradientBanner && candidates.length > 0 && !dismissed;
  const message = candidates[idx] ?? "";

  return (
    <div
      className={`neon-breaking-banner relative z-10 overflow-hidden transition-[height,opacity] duration-200 ${
        visible ? "h-auto opacity-100" : "h-0 overflow-hidden opacity-0"
      }`}
      role="alert"
      aria-live="assertive"
      aria-hidden={!visible}
      style={{ fontFamily: "var(--font-orbitron, var(--font-display, var(--font-sans)))" }}
    >
      {/* edge vignettes */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-16 z-[1]"
        style={{ background: "linear-gradient(90deg, rgba(0,0,0,.35), transparent)" }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-16 z-[1]"
        style={{ background: "linear-gradient(-90deg, rgba(0,0,0,.35), transparent)" }}
      />

      <div className="relative z-[2] flex items-center justify-center gap-3 md:gap-4 px-10 py-1.5 text-white tracking-[0.24em] uppercase font-bold text-[11px] md:text-xs">
        <span aria-hidden="true" className="opacity-90">&#9888;</span>
        <span
          className="hidden md:inline-flex items-center border border-white/40 bg-black/35 px-2 py-[1px] text-[9.5px] tracking-[0.32em] font-bold"
        >
          CRITICAL
        </span>
        <span aria-hidden="true" className="opacity-90">&#128225;</span>
        <span
          className="truncate max-w-[70vw] transition-opacity duration-200"
          style={{ opacity: fade ? 1 : 0 }}
        >
          {message}
        </span>
        <span aria-hidden="true" className="opacity-90">&#9888;</span>
      </div>

      <button
        type="button"
        aria-label="Dismiss critical alert"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-[3] w-5 h-5 grid place-items-center border border-white/50 text-white text-[12px] leading-none hover:bg-white/15"
      >
        &times;
      </button>
    </div>
  );
}
