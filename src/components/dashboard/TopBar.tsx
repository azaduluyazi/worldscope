"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatUTC } from "@/lib/utils/date";
import { useEffect, useState } from "react";
import { VARIANTS, type VariantId } from "@/config/variants";
import { useLocaleSwitcher } from "@/hooks/useLocale";
import { locales } from "@/i18n/config";
import { SearchBar } from "./SearchBar";
import { NotificationBell } from "./NotificationBell";
import { QuickNav } from "./QuickNav";

const VARIANT_ROUTES: { id: VariantId; href: string }[] = [
  { id: "world", href: "/" },
  { id: "tech", href: "/tech" },
  { id: "finance", href: "/finance" },
  { id: "commodity", href: "/commodity" },
  { id: "happy", href: "/happy" },
];

interface TopBarProps {
  variant?: VariantId;
}

export function TopBar({ variant = "world" }: TopBarProps) {
  const [time, setTime] = useState(formatUTC());
  const config = VARIANTS[variant];
  const t = useTranslations();
  const { locale, switchLocale, isPending } = useLocaleSwitcher();

  useEffect(() => {
    const interval = setInterval(() => setTime(formatUTC()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-10 md:h-11 bg-gradient-to-b from-hud-panel to-hud-surface border-b border-hud-border flex items-center px-2 md:px-4 z-50">
      {/* Logo — compact on mobile */}
      <div className="flex items-center gap-1.5 md:gap-2">
        <div
          className="w-6 h-6 md:w-7 md:h-7 border-2 rounded-full flex items-center justify-center"
          style={{ borderColor: config.accent }}
        >
          <div
            className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full animate-radar"
            style={{
              background: `conic-gradient(from 0deg, ${config.accent}, transparent, ${config.accent})`,
            }}
          />
        </div>
        <span
          className="font-mono text-xs md:text-sm font-bold tracking-[2px] md:tracking-[3px]"
          style={{ color: config.accent }}
        >
          <span className="md:hidden">{config.icon}</span>
          <span className="hidden md:inline">{config.name.toUpperCase()}</span>
        </span>
        <span className="font-mono text-[8px] md:text-[9px] text-hud-muted ml-0.5 md:ml-1 hidden sm:inline">
          {t("app.version")}
        </span>
      </div>

      {/* Variant Tabs */}
      <div className="flex-1 flex justify-center gap-0.5 md:gap-1">
        {VARIANT_ROUTES.map((route) => {
          const isActive = route.id === variant;
          const routeConfig = VARIANTS[route.id];
          return (
            <Link
              key={route.id}
              href={route.href}
              className={`px-2 md:px-4 py-0.5 md:py-1 rounded-sm font-mono text-[8px] md:text-[10px] tracking-wider transition-colors ${
                isActive
                  ? "font-bold"
                  : "bg-hud-surface text-hud-muted border border-hud-border hover:border-hud-accent/30"
              }`}
              style={
                isActive
                  ? { backgroundColor: routeConfig.accent, color: "#050a12" }
                  : undefined
              }
            >
              {t(`variants.${route.id}`)}
            </Link>
          );
        })}
      </div>

      {/* Right section — search + locale + live + clock */}
      <div className="flex items-center gap-1.5 md:gap-3 font-mono text-[8px] md:text-[9px]">
        {/* Search + Notifications + Nav */}
        <div className="hidden md:flex items-center gap-1.5">
          <SearchBar />
          <NotificationBell />
          <QuickNav />
        </div>
        {/* Locale switcher */}
        <div className="flex border border-hud-border rounded overflow-hidden">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              disabled={isPending}
              className={`px-1.5 py-0.5 text-[7px] md:text-[8px] tracking-wider transition-colors ${
                locale === loc
                  ? "bg-hud-accent/20 text-hud-accent font-bold"
                  : "text-hud-muted hover:text-hud-text"
              }`}
            >
              {t(`locale.${loc}`)}
            </button>
          ))}
        </div>
        <span className="text-severity-low animate-blink">● {t("app.live")}</span>
        <span className="text-hud-muted hidden sm:inline">{time}</span>
        <button className="w-5 h-5 md:w-6 md:h-6 border border-hud-border rounded flex items-center justify-center hover:border-hud-accent/30 transition-colors text-xs md:text-base">
          🔔
        </button>
      </div>
    </header>
  );
}
