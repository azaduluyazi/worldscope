"use client";

import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "@/config/countries";
import { VARIANTS, type VariantId } from "@/config/variants";
import { DEFAULT_LAYERS } from "@/config/map-layers";

/* ═══ Types ═══ */
interface CommandPaletteProps {
  onNavigate?: (path: string) => void;
  onSelectCountry?: (countryCode: string) => void;
  onToggleLayer?: (layerId: string) => void;
  isAdmin?: boolean;
}

/* ═══ Variant display config ═══ */
const VARIANT_LIST: { id: VariantId; label: string; icon: string; shortcut?: string }[] = [
  { id: "world", label: "WorldScope", icon: "🌍", shortcut: "1" },
  { id: "conflict", label: "ConflictScope", icon: "⚔️", shortcut: "2" },
  { id: "tech", label: "TechScope", icon: "💻", shortcut: "3" },
  { id: "finance", label: "FinScope", icon: "📊", shortcut: "4" },
  { id: "cyber", label: "CyberScope", icon: "🛡️", shortcut: "5" },
  { id: "weather", label: "WeatherScope", icon: "🌡️", shortcut: "6" },
  { id: "health", label: "HealthScope", icon: "🏥", shortcut: "7" },
  { id: "energy", label: "EnergyScope", icon: "⚡", shortcut: "8" },
  { id: "sports", label: "SportsScope", icon: "⚽", shortcut: "9" },
  { id: "happy", label: "GoodScope", icon: "🌟", shortcut: "0" },
];

/* ═══ Action items ═══ */
const ACTIONS = [
  { id: "ai-brief", label: "Generate AI Brief", icon: "🤖", shortcut: "B" },
  { id: "change-theme", label: "Change Theme", icon: "🎨", shortcut: "T" },
  { id: "change-language", label: "Change Language", icon: "🌐", shortcut: "L" },
  { id: "toggle-fullscreen", label: "Toggle Fullscreen", icon: "⛶", shortcut: "F" },
];

const ADMIN_ITEMS = [
  { id: "gateway-status", label: "Gateway Status", icon: "📡", path: "/admin/gateway" },
  { id: "feed-dashboard", label: "Feed Dashboard", icon: "📰", path: "/admin/feeds" },
];

/* ═══ Component ═══ */
export function CommandPalette({
  onNavigate,
  onSelectCountry,
  onToggleLayer,
  isAdmin = false,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  /* Keyboard shortcut: Ctrl+K / Cmd+K */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /* Navigation helper */
  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      if (onNavigate) onNavigate(path);
      else router.push(path);
    },
    [onNavigate, router],
  );

  /* Country select */
  const handleCountry = useCallback(
    (code: string) => {
      setOpen(false);
      onSelectCountry?.(code);
    },
    [onSelectCountry],
  );

  /* Layer toggle */
  const handleLayer = useCallback(
    (layerId: string) => {
      onToggleLayer?.(layerId);
    },
    [onToggleLayer],
  );

  /* Action dispatch */
  const handleAction = useCallback(
    (actionId: string) => {
      setOpen(false);
      switch (actionId) {
        case "toggle-fullscreen":
          if (document.fullscreenElement) document.exitFullscreen();
          else document.documentElement.requestFullscreen();
          break;
        default:
          // Other actions emit via onNavigate or handled by parent
          onNavigate?.(`/action/${actionId}`);
          break;
      }
    },
    [onNavigate],
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Command palette */}
      <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]">
        <Command
          className="w-full max-w-[560px] rounded border border-hud-border bg-hud-surface shadow-2xl shadow-black/50 font-mono text-[11px]"
          label="Command Palette"
        >
          {/* Input */}
          <div className="flex items-center gap-2 border-b border-hud-border px-3 py-2">
            <span className="text-hud-accent text-[10px] opacity-60">{">"}</span>
            <Command.Input
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-hud-text text-[11px] placeholder:text-hud-muted outline-none caret-hud-accent"
              autoFocus
            />
            <kbd className="rounded border border-hud-border bg-hud-panel px-1.5 py-0.5 text-[9px] text-hud-muted">
              ESC
            </kbd>
          </div>

          {/* List */}
          <Command.List className="max-h-[400px] overflow-y-auto p-1.5 scrollbar-thin">
            <Command.Empty className="py-8 text-center text-hud-muted text-[10px]">
              No results found.
            </Command.Empty>

            {/* ── Navigate ── */}
            <Command.Group
              heading={
                <span className="px-2 text-[9px] font-bold uppercase tracking-widest text-hud-accent/60">
                  Navigate
                </span>
              }
            >
              {VARIANT_LIST.map((v) => (
                <Command.Item
                  key={v.id}
                  value={`navigate ${v.label} ${v.id}`}
                  onSelect={() => navigate(`/${v.id === "world" ? "" : v.id}`)}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-hud-text transition-colors aria-selected:bg-hud-accent/10 aria-selected:text-hud-accent hover:bg-hud-panel"
                >
                  <span className="w-5 text-center">{v.icon}</span>
                  <span className="flex-1">{v.label}</span>
                  {v.shortcut && (
                    <kbd className="rounded border border-hud-border bg-hud-panel px-1 py-0.5 text-[9px] text-hud-muted">
                      {v.shortcut}
                    </kbd>
                  )}
                </Command.Item>
              ))}
            </Command.Group>

            {/* ── Countries ── */}
            <Command.Group
              heading={
                <span className="px-2 text-[9px] font-bold uppercase tracking-widest text-hud-accent/60">
                  Countries
                </span>
              }
            >
              {COUNTRIES.map((c) => (
                <Command.Item
                  key={c.code}
                  value={`country ${c.name} ${c.nameTr} ${c.code} ${c.region}`}
                  onSelect={() => handleCountry(c.code)}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-hud-text transition-colors aria-selected:bg-hud-accent/10 aria-selected:text-hud-accent hover:bg-hud-panel"
                >
                  <span className="w-5 text-center text-[10px]">📍</span>
                  <span className="flex-1">
                    {c.name}{" "}
                    <span className="text-hud-muted">({c.code})</span>
                  </span>
                  <span className="text-[9px] text-hud-muted">{c.region}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* ── Layers ── */}
            <Command.Group
              heading={
                <span className="px-2 text-[9px] font-bold uppercase tracking-widest text-hud-accent/60">
                  Layers
                </span>
              }
            >
              {DEFAULT_LAYERS.map((layer) => (
                <Command.Item
                  key={layer.id}
                  value={`layer ${layer.label} ${layer.id} ${layer.group}`}
                  onSelect={() => handleLayer(layer.id)}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-hud-text transition-colors aria-selected:bg-hud-accent/10 aria-selected:text-hud-accent hover:bg-hud-panel"
                >
                  <span className="w-5 text-center">{layer.icon}</span>
                  <span className="flex-1">{layer.label}</span>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: layer.color }}
                  />
                </Command.Item>
              ))}
            </Command.Group>

            {/* ── Actions ── */}
            <Command.Group
              heading={
                <span className="px-2 text-[9px] font-bold uppercase tracking-widest text-hud-accent/60">
                  Actions
                </span>
              }
            >
              {ACTIONS.map((action) => (
                <Command.Item
                  key={action.id}
                  value={`action ${action.label} ${action.id}`}
                  onSelect={() => handleAction(action.id)}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-hud-text transition-colors aria-selected:bg-hud-accent/10 aria-selected:text-hud-accent hover:bg-hud-panel"
                >
                  <span className="w-5 text-center">{action.icon}</span>
                  <span className="flex-1">{action.label}</span>
                  {action.shortcut && (
                    <kbd className="rounded border border-hud-border bg-hud-panel px-1 py-0.5 text-[9px] text-hud-muted">
                      {action.shortcut}
                    </kbd>
                  )}
                </Command.Item>
              ))}
            </Command.Group>

            {/* ── Admin (conditional) ── */}
            {isAdmin && (
              <Command.Group
                heading={
                  <span className="px-2 text-[9px] font-bold uppercase tracking-widest text-severity-critical/60">
                    Admin
                  </span>
                }
              >
                {ADMIN_ITEMS.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`admin ${item.label} ${item.id}`}
                    onSelect={() => navigate(item.path)}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-hud-text transition-colors aria-selected:bg-severity-critical/10 aria-selected:text-severity-critical hover:bg-hud-panel"
                  >
                    <span className="w-5 text-center">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </>
  );
}

export default CommandPalette;
