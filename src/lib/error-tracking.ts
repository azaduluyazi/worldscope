/**
 * Lightweight error tracking — captures client-side errors
 * and sends them to /api/errors for monitoring.
 *
 * In production, this could be replaced with Sentry or similar.
 */

interface ErrorEntry {
  message: string;
  stack?: string;
  source: string;
  path: string;
  timestamp: number;
  userAgent?: string;
}

/** In-memory error buffer (server-side) — last 50 errors */
const ERROR_BUFFER_SIZE = 50;
export const errorBuffer: ErrorEntry[] = [];

export function trackError(entry: ErrorEntry) {
  if (errorBuffer.length >= ERROR_BUFFER_SIZE) {
    errorBuffer.shift();
  }
  errorBuffer.push(entry);
}

/**
 * Client-side: install global error handlers.
 * Call once from a client component (e.g., layout).
 */
export function installErrorHandlers() {
  if (typeof window === "undefined") return;

  // Unhandled errors
  window.addEventListener("error", (event) => {
    sendError({
      message: event.message,
      stack: event.error?.stack,
      source: "window.onerror",
      path: window.location.pathname,
      timestamp: Date.now(),
    });
  });

  // Unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const message =
      event.reason instanceof Error
        ? event.reason.message
        : String(event.reason);
    sendError({
      message,
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
      source: "unhandledrejection",
      path: window.location.pathname,
      timestamp: Date.now(),
    });
  });
}

function sendError(entry: ErrorEntry) {
  if (process.env.NODE_ENV !== "production") {
    console.error("[ErrorTracker]", entry.message);
    return;
  }

  // Non-blocking send via beacon
  if (typeof navigator?.sendBeacon === "function") {
    navigator.sendBeacon("/api/errors", JSON.stringify(entry));
  }
}
