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

export function addBookmark(item: { id: string; title: string; url: string; category: string; severity: string; source: string }): void {
  const bookmarks = getBookmarks();
  if (bookmarks.some((b) => b.id === item.id)) return;
  bookmarks.unshift({ ...item, savedAt: new Date().toISOString() });
  if (bookmarks.length > MAX_BOOKMARKS) bookmarks.pop();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

export function removeBookmark(id: string): void {
  const bookmarks = getBookmarks().filter((b) => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

export function isBookmarked(id: string): boolean {
  return getBookmarks().some((b) => b.id === id);
}

export function clearBookmarks(): void {
  localStorage.removeItem(STORAGE_KEY);
}
