"use client";

import { useState, useEffect, useCallback } from "react";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from "@/lib/notifications/push";

/* ── types ── */
interface NotificationPrefs {
  enabled: boolean;
  severities: {
    critical: boolean;
    high: boolean;
    medium: boolean;
  };
  categories: {
    conflict: boolean;
    cyber: boolean;
    natural: boolean;
    finance: boolean;
    energy: boolean;
  };
  sound: boolean;
}

const STORAGE_KEY = "worldscope_notification_prefs";

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  severities: { critical: true, high: true, medium: false },
  categories: { conflict: true, cyber: true, natural: true, finance: true, energy: true },
  sound: true,
};

interface NotificationSettingsProps {
  className?: string;
}

/* ── toggle component ── */
function Toggle({
  checked,
  onChange,
  label,
  color = "#00e5ff",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-1 group"
    >
      <span className="font-mono text-[9px] text-hud-text group-hover:text-hud-accent transition-colors">
        {label}
      </span>
      <div
        className="w-7 h-4 rounded-full border transition-colors relative"
        style={{
          borderColor: checked ? color : "rgba(255,255,255,0.15)",
          backgroundColor: checked ? `${color}20` : "transparent",
        }}
      >
        <div
          className="absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all duration-200"
          style={{
            left: checked ? "13px" : "2px",
            backgroundColor: checked ? color : "rgba(255,255,255,0.3)",
          }}
        />
      </div>
    </button>
  );
}

/* ── component ── */
export function NotificationSettings({ className = "" }: NotificationSettingsProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [permission, setPermission] = useState<string>("default");
  const [mounted, setMounted] = useState(false);

  // load saved prefs
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<NotificationPrefs>;
        setPrefs((p) => ({ ...p, ...parsed }));
      }
    } catch {
      // ignore
    }
    setPermission(getNotificationPermission());
  }, []);

  // save prefs on change
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [prefs, mounted]);

  const updatePrefs = useCallback((patch: Partial<NotificationPrefs>) => {
    setPrefs((p) => ({ ...p, ...patch }));
  }, []);

  const handleEnableToggle = useCallback(
    async (val: boolean) => {
      if (val && permission !== "granted") {
        const granted = await requestNotificationPermission();
        setPermission(getNotificationPermission());
        if (!granted) return;
      }
      updatePrefs({ enabled: val });
    },
    [permission, updatePrefs],
  );

  const supported = isNotificationSupported();

  return (
    <div className={`h-full overflow-auto custom-scrollbar flex flex-col ${className}`}>
      {/* header */}
      <div className="sticky top-0 z-10 bg-hud-panel border-b border-hud-border/50 px-2.5 py-1.5 flex items-center justify-between">
        <span className="font-mono text-[9px] text-hud-accent tracking-widest uppercase">
          Notification Settings
        </span>
        <span
          className="font-mono text-[7px] px-1.5 py-0.5 rounded"
          style={{
            color: permission === "granted" ? "#00ff88" : permission === "denied" ? "#ff4757" : "#ffd000",
            backgroundColor:
              permission === "granted"
                ? "rgba(0,255,136,0.15)"
                : permission === "denied"
                  ? "rgba(255,71,87,0.15)"
                  : "rgba(255,208,0,0.15)",
          }}
        >
          {permission.toUpperCase()}
        </span>
      </div>

      <div className="flex flex-col gap-3 px-2.5 py-2">
        {/* browser support warning */}
        {!supported && (
          <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
            <span className="font-mono text-[8px] text-red-400">
              Browser notifications not supported
            </span>
          </div>
        )}

        {/* main toggle */}
        <div className="bg-hud-surface/50 border border-hud-border/50 rounded p-2">
          <Toggle
            checked={prefs.enabled}
            onChange={handleEnableToggle}
            label="PUSH NOTIFICATIONS"
            color="#00e5ff"
          />
        </div>

        {/* severity filters */}
        <div className="bg-hud-surface/50 border border-hud-border/50 rounded p-2">
          <div className="font-mono text-[7px] text-hud-accent tracking-wider mb-1.5">
            SEVERITY FILTER
          </div>
          <Toggle
            checked={prefs.severities.critical}
            onChange={(v) => updatePrefs({ severities: { ...prefs.severities, critical: v } })}
            label="Critical"
            color="#ff4757"
          />
          <Toggle
            checked={prefs.severities.high}
            onChange={(v) => updatePrefs({ severities: { ...prefs.severities, high: v } })}
            label="High"
            color="#ff8c00"
          />
          <Toggle
            checked={prefs.severities.medium}
            onChange={(v) => updatePrefs({ severities: { ...prefs.severities, medium: v } })}
            label="Medium"
            color="#ffd000"
          />
        </div>

        {/* category filters */}
        <div className="bg-hud-surface/50 border border-hud-border/50 rounded p-2">
          <div className="font-mono text-[7px] text-hud-accent tracking-wider mb-1.5">
            CATEGORY FILTER
          </div>
          <Toggle
            checked={prefs.categories.conflict}
            onChange={(v) => updatePrefs({ categories: { ...prefs.categories, conflict: v } })}
            label="Conflict"
            color="#ff4757"
          />
          <Toggle
            checked={prefs.categories.cyber}
            onChange={(v) => updatePrefs({ categories: { ...prefs.categories, cyber: v } })}
            label="Cyber"
            color="#8a5cf6"
          />
          <Toggle
            checked={prefs.categories.natural}
            onChange={(v) => updatePrefs({ categories: { ...prefs.categories, natural: v } })}
            label="Natural Disaster"
            color="#ffd000"
          />
          <Toggle
            checked={prefs.categories.finance}
            onChange={(v) => updatePrefs({ categories: { ...prefs.categories, finance: v } })}
            label="Finance"
            color="#00e5ff"
          />
          <Toggle
            checked={prefs.categories.energy}
            onChange={(v) => updatePrefs({ categories: { ...prefs.categories, energy: v } })}
            label="Energy"
            color="#00ff88"
          />
        </div>

        {/* sound toggle */}
        <div className="bg-hud-surface/50 border border-hud-border/50 rounded p-2">
          <div className="font-mono text-[7px] text-hud-accent tracking-wider mb-1.5">
            AUDIO
          </div>
          <Toggle
            checked={prefs.sound}
            onChange={(v) => updatePrefs({ sound: v })}
            label="Alert Sound"
            color="#00e5ff"
          />
        </div>
      </div>
    </div>
  );
}
