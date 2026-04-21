"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "./useUser";

export interface BookmarkEvent {
  id: string;
  title: string;
  severity: string;
  category: string;
  source: string;
  url: string | null;
  country_code: string | null;
  published_at: string;
}

export interface Bookmark {
  id: string;
  note: string | null;
  created_at: string;
  event_id: string;
  events: BookmarkEvent | null;
}

/**
 * Manages the signed-in user's bookmarks. Keeps a Set<eventId> in state
 * for quick "is this one saved?" lookups on feed rows, plus the full
 * list for an /account view.
 */
export function useBookmarks() {
  const { isSignedIn, isLoaded } = useUser();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setBookmarks([]);
      setIds(new Set());
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/me/bookmarks", { cache: "no-store" });
      if (!res.ok) throw new Error(`list failed ${res.status}`);
      const body = (await res.json()) as { bookmarks: Bookmark[] };
      setBookmarks(body.bookmarks);
      setIds(new Set(body.bookmarks.map((b) => b.event_id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh();
  }, [isLoaded, refresh]);

  const add = useCallback(
    async (eventId: string, note?: string) => {
      if (!isSignedIn) return false;
      // optimistic
      setIds((prev) => new Set(prev).add(eventId));
      try {
        const res = await fetch("/api/me/bookmarks", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ eventId, note }),
        });
        if (!res.ok) throw new Error(`add failed ${res.status}`);
        await refresh();
        return true;
      } catch (err) {
        setIds((prev) => {
          const copy = new Set(prev);
          copy.delete(eventId);
          return copy;
        });
        setError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    [isSignedIn, refresh],
  );

  const remove = useCallback(
    async (eventId: string) => {
      if (!isSignedIn) return false;
      // optimistic
      setIds((prev) => {
        const copy = new Set(prev);
        copy.delete(eventId);
        return copy;
      });
      try {
        const res = await fetch(`/api/me/bookmarks?eventId=${encodeURIComponent(eventId)}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(`delete failed ${res.status}`);
        await refresh();
        return true;
      } catch (err) {
        setIds((prev) => new Set(prev).add(eventId));
        setError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    [isSignedIn, refresh],
  );

  const toggle = useCallback(
    (eventId: string) => (ids.has(eventId) ? remove(eventId) : add(eventId)),
    [ids, add, remove],
  );

  return { bookmarks, ids, loading, error, add, remove, toggle, refresh };
}
