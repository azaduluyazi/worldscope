"use client";

import { useTheme } from "@/components/shared/ThemeProvider";

const LEVELS = [
  { id: "severe", label: "SEVERE", className: "defcon-severe" },
  { id: "high", label: "HIGH", className: "defcon-high" },
  { id: "elevated", label: "ELEVATED", className: "defcon-elevated" },
  { id: "guarded", label: "GUARDED", className: "defcon-guarded" },
  { id: "low", label: "LOW", className: "defcon-low" },
] as const;

interface DefconBarProps {
  /** Which level is currently active (0=severe ... 4=low). Default 0 */
  activeLevel?: number;
}

/**
 * Warzone-theme DEFCON threat-level indicator bar.
 * Only renders when the active theme has defconBar enabled.
 */
export function DefconBar({ activeLevel = 0 }: DefconBarProps) {
  const { theme } = useTheme();
  const visible = !!theme.defconBar;

  return (
    <div
      className={`defcon-bar relative z-10 transition-[height,opacity] duration-200 ${
        visible ? "" : "!h-0 overflow-hidden opacity-0"
      }`}
      role="status"
      aria-label="Threat level indicator"
      aria-hidden={!visible}
    >
      {LEVELS.map((level, i) => (
        <div
          key={level.id}
          className={`defcon-level ${level.className} ${i === activeLevel ? "defcon-active" : ""}`}
          aria-current={i === activeLevel ? "true" : undefined}
        >
          {level.label}
        </div>
      ))}
    </div>
  );
}
