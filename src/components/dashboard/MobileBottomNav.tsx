"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import type { VariantId } from "@/config/variants";
import { VARIANTS } from "@/config/variants";

export type MobilePanel = "map" | "feed" | "live" | "alerts";

interface MobileBottomNavProps {
  variant?: VariantId;
  activePanel: MobilePanel;
  onPanelChange: (panel: MobilePanel) => void;
}

const TABS: { id: MobilePanel; icon: string; tKey: string }[] = [
  { id: "map", icon: "🗺️", tKey: "mobile.map" },
  { id: "feed", icon: "📡", tKey: "mobile.intel" },
  { id: "live", icon: "📺", tKey: "mobile.live" },
  { id: "alerts", icon: "⚡", tKey: "mobile.alerts" },
];

function MobileBottomNavInner({ variant = "world", activePanel, onPanelChange }: MobileBottomNavProps) {
  const accent = VARIANTS[variant].accent;
  const t = useTranslations();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-hud-surface/95 backdrop-blur-md border-t border-hud-border safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {TABS.map((tab) => {
          const isActive = tab.id === activePanel;
          return (
            <button
              key={tab.id}
              onClick={() => onPanelChange(tab.id)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors"
            >
              <span
                className="text-base transition-transform duration-200"
                style={{ transform: isActive ? "scale(1.2)" : "scale(1)" }}
              >
                {tab.icon}
              </span>
              <span
                className="font-mono text-[7px] tracking-wider transition-colors"
                style={{ color: isActive ? accent : "var(--color-hud-muted)" }}
              >
                {t(tab.tKey)}
              </span>
              {isActive && (
                <div
                  className="absolute top-0 w-8 h-0.5 rounded-full"
                  style={{ backgroundColor: accent }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export const MobileBottomNav = memo(MobileBottomNavInner);
