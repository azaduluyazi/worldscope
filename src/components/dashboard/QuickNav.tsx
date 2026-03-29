"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
// Policy links added for Paddle compliance

const NAV_ITEMS = [
  { href: "/analytics", icon: "📊", label: "Analytics" },
  { href: "/feeds", icon: "📡", label: "Feeds" },
  { href: "/api-docs", icon: "📖", label: "API Docs" },
  { href: "/country/us", icon: "🌍", label: "Countries" },
  { href: "/search?q=", icon: "🔍", label: "Search" },
  { href: "/reports", icon: "📄", label: "Reports" },
  { href: "/bookmarks", icon: "🔖", label: "Bookmarks" },
  { href: "/admin", icon: "🔐", label: "Admin" },
];

const POLICY_ITEMS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refund", label: "Refund Policy" },
  { href: "/contact", label: "Contact" },
  { href: "/about", label: "About" },
];

export function QuickNav() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-7 h-7 rounded-md flex items-center justify-center text-sm transition-all ${
          isOpen
            ? "bg-hud-accent/15 border border-hud-accent/30"
            : "bg-hud-panel border border-hud-border hover:border-hud-muted"
        }`}
        title="Quick Navigation"
      >
        ☰
      </button>

      {isOpen && (
        <div className="absolute right-0 top-9 z-50 bg-hud-surface border border-hud-border rounded-md shadow-lg w-44 py-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 font-mono text-[9px] text-hud-muted hover:text-hud-accent hover:bg-hud-panel/50 transition-colors"
            >
              <span className="text-sm">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="border-t border-hud-border my-1" />
          {POLICY_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-1 font-mono text-[8px] text-hud-muted/50 hover:text-hud-accent hover:bg-hud-panel/50 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
