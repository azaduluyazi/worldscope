"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut: / to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !isOpen && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Auto-focus when opened
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setIsOpen(false);
  }, [query, router]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-7 h-7 rounded-md bg-hud-panel border border-hud-border flex items-center justify-center text-sm hover:border-hud-muted transition-colors"
        title="Search (press /)"
      >
        🔍
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search intel..."
        className="w-40 md:w-56 bg-hud-panel border border-hud-accent/40 rounded px-2 py-1 font-mono text-[10px] text-hud-text placeholder:text-hud-muted focus:outline-none"
      />
      <button
        type="submit"
        className="font-mono text-[8px] px-2 py-1 rounded border border-hud-accent/40 bg-hud-accent/10 text-hud-accent hover:bg-hud-accent/20 transition-colors"
      >
        GO
      </button>
      <button
        type="button"
        onClick={() => { setIsOpen(false); setQuery(""); }}
        className="font-mono text-[8px] px-1.5 py-1 rounded border border-hud-border text-hud-muted hover:text-hud-text transition-colors"
      >
        ✕
      </button>
    </form>
  );
}
