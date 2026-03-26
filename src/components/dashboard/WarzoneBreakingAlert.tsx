"use client";

import { useTheme } from "@/components/shared/ThemeProvider";

interface WarzoneBreakingAlertProps {
  text?: string;
  time?: string;
}

/**
 * Warzone-theme flashing red breaking alert bar.
 * Only renders when theme effect is "warzone".
 */
export function WarzoneBreakingAlert({ text, time }: WarzoneBreakingAlertProps) {
  const { theme } = useTheme();
  if (theme.effect !== "warzone" || !text) return null;

  return (
    <div
      className="warzone-pulse-alert border-2 border-red-900 px-4 py-2 flex items-center gap-3 relative z-10"
      role="alert"
      aria-live="assertive"
      style={{
        animation: "warzoneFlashBorder 1.5s ease-in-out infinite",
        borderColor: "#661111",
      }}
    >
      <span
        className="font-mono text-[11px] font-bold text-red-500"
        style={{ animation: "warzonePulseBg 0.8s infinite" }}
      >
        &#9608; ALERT
      </span>
      <span className="font-mono text-red-400 text-[11px] tracking-wider uppercase">
        {text}
      </span>
      {time && (
        <span className="font-mono text-red-800 text-[10px] ml-auto">{time}</span>
      )}
    </div>
  );
}
