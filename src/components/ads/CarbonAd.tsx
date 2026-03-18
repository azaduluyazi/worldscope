"use client";

import { useEffect, useRef } from "react";
import { CARBON_SERVE, CARBON_PLACEMENT } from "@/config/ads";

interface CarbonAdProps {
  className?: string;
}

/**
 * Carbon Ads unit — premium developer-focused ads.
 * Loads the Carbon Ads script dynamically.
 */
export function CarbonAd({ className = "" }: CarbonAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!CARBON_SERVE || !CARBON_PLACEMENT || loaded.current) return;
    if (!containerRef.current) return;

    // Check consent
    if (typeof window !== "undefined" && !window.localStorage.getItem("ws-ad-consent")) {
      return;
    }

    const script = document.createElement("script");
    script.src = `//cdn.carbonads.com/carbon.js?serve=${CARBON_SERVE}&placement=${CARBON_PLACEMENT}`;
    script.id = "_carbonads_js";
    script.async = true;
    containerRef.current.appendChild(script);
    loaded.current = true;

    const container = containerRef.current;
    return () => {
      if (container) {
        const existing = container.querySelector("#_carbonads_js");
        if (existing) existing.remove();
      }
    };
  }, []);

  if (!CARBON_SERVE || !CARBON_PLACEMENT) return null;

  return (
    <div ref={containerRef} className={`carbon-ad-wrapper ${className}`}>
      <style>{`
        #carbonads {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          background: var(--color-hud-surface);
          border: 1px solid var(--color-hud-border);
          border-radius: 6px;
          padding: 12px;
          max-width: 300px;
        }
        #carbonads a {
          color: var(--color-hud-text);
          text-decoration: none;
        }
        #carbonads a:hover {
          color: var(--color-hud-accent);
        }
        #carbonads .carbon-img img {
          border-radius: 4px;
        }
        #carbonads .carbon-poweredby {
          color: var(--color-hud-muted);
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}
