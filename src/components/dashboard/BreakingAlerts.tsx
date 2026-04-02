"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useIntelFeed } from "@/hooks/useIntelFeed";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import type { IntelItem } from "@/types/intel";
import { timeAgo } from "@/lib/utils/date";
import { truncate } from "@/lib/utils/sanitize";

/** Play alert sound if user has enabled it */
function playAlertSound(severity: "critical" | "high") {
  try {
    const enabled = typeof window !== "undefined" && localStorage.getItem("ws-sound-alerts") !== "false";
    if (!enabled) return;
    const src = severity === "critical" ? "/sounds/alert-critical.wav" : "/sounds/alert-high.wav";
    const audio = new Audio(src);
    audio.volume = severity === "critical" ? 0.6 : 0.4;
    audio.play().catch(() => {/* user hasn't interacted yet — silent fail */});
  } catch {/* SSR or blocked */}
}

/** Auto-rotating breaking news with urgency animations and smooth transitions */
export function BreakingAlerts() {
  const t = useTranslations();
  const { items } = useIntelFeed();
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevCountRef = useRef(0);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load sound preference
  useEffect(() => {
    const stored = localStorage.getItem("ws-sound-alerts");
    if (stored === "false") setSoundEnabled(false);
  }, []);

  // Filter critical and high severity items
  const alerts = useMemo(() => {
    return items
      .filter((i) => i.severity === "critical" || i.severity === "high")
      .slice(0, 20);
  }, [items]);

  // Detect new alerts arriving — play sound + flash
  useEffect(() => {
    if (alerts.length > prevCountRef.current && prevCountRef.current > 0) {
      // Play sound for the newest alert
      const newest = alerts[0];
      if (newest) playAlertSound(newest.severity === "critical" ? "critical" : "high");

      const flashTimer = setTimeout(() => {
        setHasNewAlert(true);
        setHighlightIdx(0);
      }, 0);
      const clearTimer = setTimeout(() => setHasNewAlert(false), 3000);
      prevCountRef.current = alerts.length;
      return () => {
        clearTimeout(flashTimer);
        clearTimeout(clearTimer);
      };
    }
    prevCountRef.current = alerts.length;
  }, [alerts.length, alerts]);

  // Auto-rotate featured alert every 6s with transition
  useEffect(() => {
    if (alerts.length <= 1) return;
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setHighlightIdx((prev) => (prev + 1) % Math.min(alerts.length, 5));
        setIsTransitioning(false);
      }, 200);
    }, 6000);
    return () => clearInterval(timer);
  }, [alerts.length]);

  const featured = alerts[highlightIdx];
  const hasCritical = alerts.some((a) => a.severity === "critical");

  return (
    <div
      className={`h-full flex flex-col bg-hud-surface/50 border rounded-lg overflow-hidden transition-colors ${
        hasCritical ? "border-severity-critical/30 urgency-pulse" : "border-hud-border"
      } ${hasNewAlert ? "alert-flash" : ""}`}
    >
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-hud-border flex items-center justify-between">
        <span className="hud-label text-[9px] flex items-center gap-1.5">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              hasCritical ? "bg-severity-critical live-glow" : "bg-severity-high"
            }`}
            style={{ color: hasCritical ? "#ff4757" : "#ffd000" }}
          />
          {t("alerts.title")}
        </span>
        <div className="flex items-center gap-2">
          {hasNewAlert && (
            <span className="font-mono text-[7px] text-severity-critical tracking-wider animate-blink">
              {t("alerts.new")}
            </span>
          )}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              localStorage.setItem("ws-sound-alerts", String(next));
              if (next) playAlertSound("high"); // preview sound
            }}
            className={`font-mono text-[8px] px-1 py-0.5 rounded border transition-colors ${
              soundEnabled
                ? "text-hud-accent border-hud-accent/30 bg-hud-accent/10"
                : "text-hud-muted border-hud-border"
            }`}
            title={soundEnabled ? "Disable sound alerts" : "Enable sound alerts"}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
          <span className="font-mono text-[8px] text-hud-muted">
            {t("alerts.active", { count: alerts.length })}
          </span>
        </div>
      </div>

      {/* Featured Alert — large display with transition */}
      {featured ? (
        <a
          href={featured.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`px-3 py-2.5 border-b border-hud-border hover:bg-hud-panel/50 transition-all duration-300 ${
            isTransitioning ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
          }`}
          style={{
            background: `linear-gradient(90deg, ${SEVERITY_COLORS[featured.severity]}08 0%, transparent 100%)`,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="font-mono text-[9px] font-bold tracking-wider"
              style={{ color: SEVERITY_COLORS[featured.severity] }}
            >
              {CATEGORY_ICONS[featured.category]} {featured.severity.toUpperCase()}
            </span>
            <span className="font-mono text-[7px] text-hud-muted">
              {timeAgo(featured.publishedAt)}
            </span>
          </div>
          <p className="text-[12px] text-hud-text leading-snug font-medium">
            {truncate(featured.title, 130)}
          </p>
          {featured.summary && (
            <p className="text-[9px] text-hud-muted leading-relaxed mt-1">
              {truncate(featured.summary, 100)}
            </p>
          )}
          <div className="flex items-center justify-between mt-1.5">
            <span className="font-mono text-[7px] text-hud-muted">{featured.source}</span>
            {alerts.length > 1 && (
              <div className="flex gap-1">
                {alerts.slice(0, 5).map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setHighlightIdx(i);
                    }}
                    className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: i === highlightIdx
                        ? SEVERITY_COLORS[alerts[i]?.severity || "critical"]
                        : "#1a2a3a",
                      transform: i === highlightIdx ? "scale(1.3)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </a>
      ) : (
        <div className="px-3 py-6 text-center">
          <span className="font-mono text-[10px] text-severity-low glow-green">
            ✓ {t("alerts.allClear")}
          </span>
        </div>
      )}

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto hud-scrollbar">
        <div className="p-1 flex flex-col gap-0.5">
          {alerts.slice(0, 15).map((alert, idx) => (
            <AlertRow
              key={alert.id}
              item={alert}
              isHighlighted={idx === highlightIdx}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AlertRow({
  item,
  isHighlighted,
}: {
  item: IntelItem;
  isHighlighted: boolean;
}) {
  const color = SEVERITY_COLORS[item.severity];
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-start gap-2 px-2 py-1.5 rounded transition-all duration-200 hover:bg-hud-panel/60 border-l-2 ${
        isHighlighted ? "bg-hud-panel/40" : "border-transparent"
      }`}
      style={{ borderColor: isHighlighted ? color : "transparent" }}
    >
      <span className="text-[9px] mt-0.5 shrink-0">{CATEGORY_ICONS[item.category]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] text-hud-text leading-snug truncate">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-mono text-[7px] font-bold" style={{ color }}>
            {item.severity.toUpperCase()}
          </span>
          <span className="font-mono text-[7px] text-hud-muted">
            {timeAgo(item.publishedAt)}
          </span>
        </div>
      </div>
    </a>
  );
}
