/**
 * Event bookmarking — save intel items to localStorage.
 */

const STORAGE_KEY = "worldscope_bookmarks";
const MAX_BOOKMARKS = 100;

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  category: string;
  severity: string;
  source: string;
  savedAt: string;
}

export function getBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

// Event bus so components can subscribe to bookmark changes via
// useSyncExternalStore. Native 'storage' events only fire cross-tab;
// we dispatch a custom same-tab event on every mutation.
const CHANGE_EVENT = "ws:bookmarks-change";
function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}
export function subscribeBookmarks(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function addBookmark(item: { id: string; title: string; url: string; category: string; severity: string; source: string }): void {
  const bookmarks = getBookmarks();
  if (bookmarks.some((b) => b.id === item.id)) return;
  bookmarks.unshift({ ...item, savedAt: new Date().toISOString() });
  if (bookmarks.length > MAX_BOOKMARKS) bookmarks.pop();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  emitChange();
}

export function removeBookmark(id: string): void {
  const bookmarks = getBookmarks().filter((b) => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  emitChange();
}

export function isBookmarked(id: string): boolean {
  return getBookmarks().some((b) => b.id === id);
}

export function clearBookmarks(): void {
  localStorage.removeItem(STORAGE_KEY);
  emitChange();
}
