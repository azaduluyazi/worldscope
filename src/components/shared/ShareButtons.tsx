"use client";

import { useState, useCallback } from "react";

interface ShareButtonsProps {
  url: string;
  title: string;
  /** Optional text for platforms that support separate text + URL */
  text?: string;
  className?: string;
  /** Compact mode — icons only, no "Share" label */
  compact?: boolean;
}

/**
 * Social share buttons — X, Bluesky, LinkedIn, Telegram, WhatsApp, Copy Link.
 * Uses Web Share API as primary (mobile), falls back to platform URLs.
 * No external dependencies.
 */
export function ShareButtons({
  url,
  title,
  text,
  className = "",
  compact = false,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(text || title);

  const links = [
    {
      name: "X",
      icon: "𝕏",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&via=Troiamediacom`,
    },
    {
      name: "Bluesky",
      icon: "🦋",
      href: `https://bsky.app/intent/compose?text=${encodedTitle}+${encodedUrl}`,
    },
    {
      name: "Telegram",
      icon: "✈",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: "WhatsApp",
      icon: "💬",
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      name: "LinkedIn",
      icon: "in",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for insecure contexts
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title, text: text || title, url });
    } catch {
      // User cancelled — ignore
    }
  }, [title, text, url]);

  const btnClass =
    "w-7 h-7 flex items-center justify-center rounded border border-hud-border/50 text-hud-muted hover:text-hud-accent hover:border-hud-accent/50 transition-colors font-mono text-[10px]";

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {!compact && (
        <span className="font-mono text-[8px] text-hud-muted uppercase tracking-wider mr-0.5">
          Share
        </span>
      )}

      {/* Native share — mobile only */}
      {typeof navigator !== "undefined" && "share" in navigator && (
        <button onClick={handleNativeShare} className={btnClass} title="Share">
          ↗
        </button>
      )}

      {links.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
          title={`Share on ${link.name}`}
        >
          {link.icon}
        </a>
      ))}

      <button
        onClick={handleCopy}
        className={`${btnClass} ${copied ? "!text-green-400 !border-green-400/50" : ""}`}
        title={copied ? "Copied!" : "Copy link"}
      >
        {copied ? "✓" : "📋"}
      </button>
    </div>
  );
}
