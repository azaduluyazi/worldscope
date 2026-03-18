"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getBookmarks, removeBookmark, clearBookmarks, type Bookmark } from "@/lib/bookmarks";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import type { Category, Severity } from "@/types/intel";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => { setBookmarks(getBookmarks()); }, []);

  const handleRemove = useCallback((id: string) => {
    removeBookmark(id);
    setBookmarks(getBookmarks());
  }, []);

  const handleClear = useCallback(() => {
    if (!confirm("Clear all bookmarks?")) return;
    clearBookmarks();
    setBookmarks([]);
  }, []);

  return (
    <div className="min-h-screen bg-hud-base text-hud-text">
      <header className="border-b border-hud-border bg-hud-surface">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-[9px] font-mono text-hud-muted mb-3">
            <Link href="/" className="text-hud-accent hover:underline">WORLDSCOPE</Link>
            <span>/</span>
            <span className="text-hud-text">BOOKMARKS</span>
          </nav>
          <div className="flex items-center justify-between">
            <h1 className="font-mono text-xl font-bold text-hud-text tracking-wide">🔖 SAVED INTEL</h1>
            {bookmarks.length > 0 && (
              <button onClick={handleClear} className="font-mono text-[8px] px-2 py-1 rounded border border-severity-critical/30 text-severity-critical hover:bg-severity-critical/10 transition-colors">
                CLEAR ALL
              </button>
            )}
          </div>
          <p className="font-mono text-[10px] text-hud-muted mt-1">{bookmarks.length} saved items</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {bookmarks.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-mono text-[11px] text-hud-muted">No bookmarks yet</p>
            <Link href="/" className="font-mono text-[10px] text-hud-accent hover:underline mt-4 inline-block">← Back to Dashboard</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {bookmarks.map((b) => (
              <div key={b.id} className="bg-hud-surface border border-hud-border rounded-md p-3 flex items-start gap-3">
                <span className="text-base shrink-0">{CATEGORY_ICONS[b.category as Category] || "📌"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-mono text-[8px] font-bold px-1.5 py-0.5 rounded border"
                      style={{ color: SEVERITY_COLORS[b.severity as Severity], borderColor: `${SEVERITY_COLORS[b.severity as Severity]}40`, backgroundColor: `${SEVERITY_COLORS[b.severity as Severity]}10` }}>
                      {b.severity.toUpperCase()}
                    </span>
                    <span className="font-mono text-[7px] text-hud-muted">{b.source}</span>
                    <span className="font-mono text-[7px] text-hud-muted ml-auto">{new Date(b.savedAt).toLocaleDateString()}</span>
                  </div>
                  <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-hud-text hover:text-hud-accent transition-colors">
                    {b.title}
                  </a>
                </div>
                <button onClick={() => handleRemove(b.id)} className="font-mono text-[8px] text-hud-muted hover:text-severity-critical shrink-0" title="Remove">✕</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
