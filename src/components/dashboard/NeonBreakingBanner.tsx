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
  const visible = theme.gradientBanner && !!text;

  return (
    <div
      className={`neon-breaking-banner px-4 py-2 text-center font-bold tracking-widest text-sm uppercase text-white relative z-10 font-display transition-[height,opacity] duration-200 ${
        visible ? "h-auto opacity-100" : "h-0 overflow-hidden opacity-0 py-0"
      }`}
      role="alert"
      aria-live="assertive"
      aria-hidden={!visible}
      style={{ fontFamily: "var(--font-orbitron, var(--font-sans))" }}
    >
      <span className="mr-2" aria-hidden="true">&#9888;</span>
      {text}
      <span className="ml-2" aria-hidden="true">&#9888;</span>
    </div>
  );
}
