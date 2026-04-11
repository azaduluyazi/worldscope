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
  const visible = theme.effect === "warzone" && !!text;

  return (
    <div
      className={`warzone-pulse-alert border-2 border-red-900 px-4 py-2 flex items-center gap-3 relative z-10 transition-[height,opacity] duration-200 ${
        visible ? "" : "!h-0 overflow-hidden opacity-0 !py-0 !border-0"
      }`}
      role="alert"
      aria-live="assertive"
      aria-hidden={!visible}
      style={visible ? {
        animation: "warzoneFlashBorder 1.5s ease-in-out infinite",
        borderColor: "#661111",
      } : undefined}
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
