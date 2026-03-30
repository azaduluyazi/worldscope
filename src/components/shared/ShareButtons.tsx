"use client";

interface ShareButtonsProps {
  url: string;
  title: string;
  className?: string;
}

/**
 * Social share buttons — Twitter/X, LinkedIn, Telegram, Copy Link.
 * No external dependencies — uses native share URLs.
 */
export function ShareButtons({ url, title, className = "" }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    { name: "X", icon: "\u{1D54F}", href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` },
    { name: "LinkedIn", icon: "in", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { name: "Telegram", icon: "\u2708", href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}` },
  ];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    // Could show a toast here
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-mono text-[8px] text-hud-muted uppercase tracking-wider">Share</span>
      {links.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="w-7 h-7 flex items-center justify-center rounded border border-hud-border/50 text-hud-muted hover:text-hud-accent hover:border-hud-accent/50 transition-colors font-mono text-[10px]"
          title={`Share on ${link.name}`}
        >
          {link.icon}
        </a>
      ))}
      <button
        onClick={handleCopy}
        className="w-7 h-7 flex items-center justify-center rounded border border-hud-border/50 text-hud-muted hover:text-hud-accent hover:border-hud-accent/50 transition-colors font-mono text-[10px]"
        title="Copy link"
      >
        📋
      </button>
    </div>
  );
}
