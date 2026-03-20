"use client";

import { useState, useRef, useEffect } from "react";
import { useLocaleSwitcher } from "@/hooks/useLocale";
import { LOCALE_NAMES, RTL_LOCALES, type Locale, locales } from "@/i18n/config";

/**
 * Compact language selector dropdown for TopBar.
 * Shows current locale code, opens a scrollable grid on click.
 */
export function LanguageSelector() {
  const { locale, switchLocale, isPending } = useLocaleSwitcher();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [isOpen]);

  const isRTL = RTL_LOCALES.includes(locale);

  return (
    <div ref={ref} className="relative">
      {/* Trigger button — shows current locale code */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-1 px-1.5 py-0.5 border border-hud-border rounded text-[8px] md:text-[9px] font-mono tracking-wider text-hud-accent hover:border-hud-accent/50 transition-colors"
        title={LOCALE_NAMES[locale]}
      >
        <span className="text-[10px]">🌐</span>
        <span>{locale.toUpperCase()}</span>
        <span className={`text-[6px] transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className={`absolute top-full mt-1 ${isRTL ? "left-0" : "right-0"} z-[100] w-64 max-h-80 overflow-y-auto bg-hud-panel border border-hud-border rounded-md shadow-lg shadow-black/50`}
        >
          <div className="p-1.5 border-b border-hud-border">
            <span className="font-mono text-[8px] text-hud-muted tracking-wider">
              SELECT LANGUAGE — {locales.length} AVAILABLE
            </span>
          </div>
          <div className="grid grid-cols-2 gap-0.5 p-1.5">
            {locales.map((loc) => {
              const isActive = loc === locale;
              return (
                <button
                  key={loc}
                  onClick={() => {
                    switchLocale(loc);
                    setIsOpen(false);
                  }}
                  disabled={isPending}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-left transition-all ${
                    isActive
                      ? "bg-hud-accent/20 border border-hud-accent/40"
                      : "hover:bg-hud-surface border border-transparent hover:border-hud-border"
                  }`}
                >
                  <span
                    className={`font-mono text-[8px] font-bold tracking-wider ${
                      isActive ? "text-hud-accent" : "text-hud-muted"
                    }`}
                  >
                    {loc.toUpperCase()}
                  </span>
                  <span
                    className={`text-[9px] truncate ${
                      isActive ? "text-hud-text" : "text-hud-muted"
                    }`}
                  >
                    {LOCALE_NAMES[loc as Locale]}
                  </span>
                  {isActive && (
                    <span className="ml-auto text-hud-accent text-[8px]">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
