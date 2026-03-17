"use client";

import { useMemo } from "react";
import { AFFILIATE_BANNERS } from "@/config/ads";

interface AffiliateBannerProps {
  className?: string;
}

/**
 * Rotating affiliate banner — shows a random banner from the pool.
 * HUD-styled to blend with the WorldScope aesthetic.
 */
export function AffiliateBanner({ className = "" }: AffiliateBannerProps) {
  const banner = useMemo(() => {
    if (AFFILIATE_BANNERS.length === 0) return null;
    return AFFILIATE_BANNERS[Math.floor(Math.random() * AFFILIATE_BANNERS.length)];
  }, []);

  if (!banner) return null;

  // Check consent
  if (typeof window !== "undefined" && !window.localStorage.getItem("ws-ad-consent")) {
    return null;
  }

  return (
    <div className={`affiliate-banner ${className}`}>
      <div className="font-mono text-[7px] text-hud-muted mb-1 text-center tracking-wider">
        SPONSORED
      </div>
      <a
        href={banner.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block bg-hud-surface border border-hud-border rounded-md p-4 hover:border-hud-muted transition-colors group"
      >
        <div className="flex items-center gap-3">
          {/* Icon placeholder */}
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center text-lg font-bold"
            style={{
              backgroundColor: `${banner.color}15`,
              border: `1px solid ${banner.color}30`,
              color: banner.color,
            }}
          >
            ⚡
          </div>

          <div className="flex-1 min-w-0">
            <p
              className="font-mono text-xs font-bold group-hover:opacity-90 transition-opacity"
              style={{ color: banner.color }}
            >
              {banner.title}
            </p>
            <p className="font-mono text-[10px] text-hud-muted mt-0.5 truncate">
              {banner.description}
            </p>
          </div>

          <span
            className="font-mono text-[9px] font-bold px-2 py-1 rounded border shrink-0"
            style={{
              color: banner.color,
              borderColor: `${banner.color}40`,
              backgroundColor: `${banner.color}10`,
            }}
          >
            {banner.cta} →
          </span>
        </div>
      </a>
    </div>
  );
}
