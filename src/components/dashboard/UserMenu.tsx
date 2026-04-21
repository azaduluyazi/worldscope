"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

interface UserMenuProps {
  user: User;
}

/**
 * Avatar + dropdown replacing Clerk's <UserButton>. Shows the user's
 * profile picture (or initials fallback) and, on click, a HUD-styled
 * popover with account shortcuts and a sign-out form.
 *
 * The sign-out path is a plain <form action="/auth/sign-out"> — a POST
 * so CSRF is handled by SameSite cookies, and it works with JS disabled
 * which is how we noticed Clerk's UserButton broke on a bad hydration.
 */
export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ||
    (user.user_metadata?.picture as string | undefined) ||
    null;
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "User";
  const initial = (displayName[0] || "U").toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="User menu"
        onClick={() => setOpen((v) => !v)}
        className="w-6 h-6 md:w-7 md:h-7 rounded-full overflow-hidden bg-hud-panel ring-1 ring-hud-accent/30 hover:ring-hud-accent/60 transition-shadow flex items-center justify-center"
      >
        {avatarUrl ? (
          // Using plain <img> intentionally — Supabase avatar URLs are
          // long-lived CDN links with private cache params; next/image
          // optimization would burn our Vercel image budget for zero
          // benefit.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="font-mono text-[10px] font-bold text-hud-accent">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 bg-hud-panel border border-hud-border rounded shadow-lg shadow-black/50 py-1 z-50"
        >
          <div className="px-3 py-2 border-b border-hud-border/50">
            <div className="font-mono text-[11px] text-hud-text truncate">
              {displayName}
            </div>
            <div className="font-mono text-[9px] text-hud-muted truncate">
              {user.email}
            </div>
          </div>
          <Link
            href="/account"
            role="menuitem"
            className="block px-3 py-1.5 font-mono text-[10px] text-hud-text hover:bg-hud-accent/10 hover:text-hud-accent transition-colors"
            onClick={() => setOpen(false)}
          >
            Account
          </Link>
          <Link
            href="/pricing"
            role="menuitem"
            className="block px-3 py-1.5 font-mono text-[10px] text-hud-text hover:bg-hud-accent/10 hover:text-hud-accent transition-colors"
            onClick={() => setOpen(false)}
          >
            Pricing
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            className="block px-3 py-1.5 font-mono text-[10px] text-hud-text hover:bg-hud-accent/10 hover:text-hud-accent transition-colors"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <form action="/auth/sign-out" method="post" className="border-t border-hud-border/50 mt-1">
            <button
              type="submit"
              role="menuitem"
              className="w-full text-left px-3 py-1.5 font-mono text-[10px] text-red-300 hover:bg-red-500/10 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
