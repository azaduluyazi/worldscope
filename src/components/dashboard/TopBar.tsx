"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatUTC } from "@/lib/utils/date";
import { useEffect, useState } from "react";
import { VARIANTS, type VariantId } from "@/config/variants";
import { SearchBar } from "./SearchBar";
import { LanguageSelector } from "./LanguageSelector";
import { NotificationBell } from "./NotificationBell";
import { QuickNav } from "./QuickNav";
import { FullscreenToggle } from "./FullscreenToggle";
import { ThemeToggle } from "./ThemeToggle";
import { ThemeSelector } from "./ThemeSelector";
import { useThreatIndex } from "@/hooks/useThreatIndex";
import { FaHorseHead } from "react-icons/fa";
import { useUser } from "@/hooks/useUser";
import { UserMenu } from "./UserMenu";

/** Map threat score to DEFCON level (1=max threat, 5=lowest) */
function scoreToDefcon(score: number): { level: number; color: string; label: string } {
  if (score >= 80) return { level: 1, color: "#ff4757", label: "DEFCON 1" };
  if (score >= 60) return { level: 2, color: "#ff7e3e", label: "DEFCON 2" };
  if (score >= 40) return { level: 3, color: "#ffd000", label: "DEFCON 3" };
  if (score >= 20) return { level: 4, color: "#00e5ff", label: "DEFCON 4" };
  return { level: 5, color: "#00ff88", label: "DEFCON 5" };
}

const VARIANT_ROUTES: { id: VariantId; href: string }[] = [
  { id: "world", href: "/" },
  { id: "conflict", href: "/conflict" },
  { id: "tech", href: "/tech" },
  { id: "finance", href: "/finance" },
  { id: "cyber", href: "/cyber" },
  { id: "weather", href: "/weather" },
  { id: "health", href: "/health" },
  { id: "energy", href: "/energy" },
  { id: "sports", href: "/sports" },
];

interface TopBarProps {
  variant?: VariantId;
}

export function TopBar({ variant = "world" }: TopBarProps) {
  const [time, setTime] = useState(formatUTC());
  const config = VARIANTS[variant];
  const t = useTranslations();
  const { score } = useThreatIndex();
  const defcon = scoreToDefcon(score);

  useEffect(() => {
    const interval = setInterval(() => setTime(formatUTC()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header role="banner" className="h-10 md:h-11 bg-gradient-to-b from-hud-panel to-hud-surface border-b border-hud-border flex items-center px-2 md:px-4 z-50">
      {/* Troia Logo — Horse Head (Font Awesome, CC BY 4.0) */}
      <div className="flex items-center gap-1.5 md:gap-2">
        <FaHorseHead
          className="w-7 h-7 md:w-8 md:h-8 shrink-0 drop-shadow-[0_0_8px_var(--color-hud-accent)]"
          style={{ color: config.accent }}
        />
        <div className="flex flex-col">
          <span className="font-display text-[10px] md:text-xs font-bold tracking-[4px] md:tracking-[5px] leading-none">
            <span className="md:hidden" style={{ color: config.accent }}>{config.icon}</span>
            <span className="hidden md:inline troia-shimmer">TROIA</span>
          </span>
          <span
            className="hidden md:block font-mono text-[7px] tracking-[2px] opacity-60 leading-none mt-0.5"
            style={{ color: config.accent }}
          >
            {config.name.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Variant Tabs — all routes */}
      <nav aria-label="Dashboard variants" className="flex-1 flex justify-center gap-0.5 md:gap-1 overflow-x-auto scrollbar-hide">
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
                  : "bg-hud-surface text-hud-text/70 border border-hud-border hover:border-hud-accent/30 hover:text-hud-text"
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
      </nav>

      {/* Right section — search + locale + live + clock */}
      <div className="flex items-center gap-1.5 md:gap-3 font-mono text-[8px] md:text-[9px]">
        {/* Search + Notifications + Nav */}
        <div className="hidden md:flex items-center gap-1.5">
          <SearchBar />
          <NotificationBell />
          <ThemeToggle />
          <ThemeSelector />
          <FullscreenToggle />
          <QuickNav />
          {/* Chat quick-launch — jumps the right column to the CHAT tab via
              the #chat hash, which DashboardShell reacts to. Visible at md+
              so the top bar stays clean on mobile. */}
          <Link
            href="#chat"
            aria-label="Open WorldScope Chat"
            title="WorldScope Chat · Prometheus"
            className="flex items-center gap-1 font-display text-[9px] font-bold tracking-[0.2em] px-2 py-1 border border-hud-accent/40 text-hud-accent hover:bg-hud-accent/10 transition-colors"
          >
            ✦ CHAT
          </Link>
        </div>
        {/* Language selector — dropdown for 30 languages */}
        <LanguageSelector />
        {/* DEFCON Badge */}
        <span
          className="hidden sm:inline-flex items-center gap-1 font-mono text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded border"
          style={{
            color: defcon.color,
            borderColor: `${defcon.color}40`,
            backgroundColor: `${defcon.color}10`,
            textShadow: `0 0 8px ${defcon.color}30`,
          }}
          title={`Global Threat Level: ${score}/100`}
        >
          ◆ {defcon.label} <span className="text-[7px] opacity-70">{score}%</span>
        </span>
        <span className="text-severity-low animate-blink">● {t("app.live")}</span>
        <span className="text-hud-muted hidden sm:inline">{time}</span>
        <button className="w-5 h-5 md:w-6 md:h-6 border border-hud-border rounded flex items-center justify-center hover:border-hud-accent/30 transition-colors text-xs md:text-base">
          🔔
        </button>

        {/* ── Auth affordance: sign-in link or user avatar dropdown ── */}
        <AuthSlot />
      </div>
    </header>
  );
}

/** Client-side auth-aware slot: SIGN IN button when signed out,
 *  UserMenu (custom dropdown) when signed in. useUser keeps this reactive. */
function AuthSlot() {
  const { isLoaded, isSignedIn, user } = useUser();
  if (!isLoaded) {
    // avoid flicker — render a size-matched spacer while Supabase boots
    return <span className="inline-block w-6 h-6 md:w-7 md:h-7" aria-hidden="true" />;
  }
  if (!isSignedIn || !user) {
    return (
      <Link
        href="/sign-in"
        className="hidden sm:inline-flex items-center gap-1 font-mono text-[8px] font-bold tracking-wider px-2 py-0.5 rounded border border-hud-accent/30 text-hud-accent hover:bg-hud-accent/10 transition-colors"
      >
        SIGN IN
      </Link>
    );
  }
  return <UserMenu user={user} />;
}
