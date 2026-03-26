"use client";

import { useTheme } from "@/components/shared/ThemeProvider";

interface NeonBreakingBannerProps {
  text?: string;
}

/**
 * Neon Cyberpunk gradient-animated breaking news banner.
 * Only renders when the active theme has gradientBanner enabled.
 */
export function NeonBreakingBanner({ text }: NeonBreakingBannerProps) {
  const { theme } = useTheme();
  if (!theme.gradientBanner || !text) return null;

  return (
    <div
      className="neon-breaking-banner px-4 py-2 text-center font-bold tracking-widest text-sm uppercase text-white relative z-10 font-display"
      role="alert"
      aria-live="assertive"
      style={{ fontFamily: "var(--font-orbitron, var(--font-sans))" }}
    >
      <span className="mr-2" aria-hidden="true">&#9888;</span>
      {text}
      <span className="ml-2" aria-hidden="true">&#9888;</span>
    </div>
  );
}
