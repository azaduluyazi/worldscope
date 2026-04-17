/**
 * Browser Push Notifications for breaking alerts.
 * Uses the Notification API (no external push service needed).
 * Triggers on critical/high severity events from realtime stream.
 */

export type NotificationPermission = "granted" | "denied" | "default";

/** Check if browser notifications are supported */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Get current permission state */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission as NotificationPermission;
}

/** Request notification permission */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  const result = await Notification.requestPermission();
  return result as NotificationPermission;
}

/** Send a browser notification */
export function sendNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    url?: string;
    severity?: string;
  }
): void {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;

  const severityEmoji: Record<string, string> = {
    critical: "🔴",
    high: "🟠",
    medium: "🔵",
    low: "🟢",
    info: "🟣",
  };

  const emoji = severityEmoji[options?.severity || "info"] || "📢";

  const notification = new Notification(`${emoji} ${title}`, {
    body: options?.body || "",
    icon: options?.icon || "/icons/icon-192.svg",
    tag: options?.tag || `worldscope-${Date.now()}`,
    badge: "/icons/icon-192.svg",
    silent: false,
  });

  if (options?.url) {
    notification.onclick = () => {
      window.focus();
      window.open(options.url, "_blank");
      notification.close();
    };
  }

  // Auto-close after 10 seconds
  setTimeout(() => notification.close(), 10000);
}

/** Check if user has enabled notifications in preferences */
export function isNotificationEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const prefs = localStorage.getItem("worldscope_prefs");
    if (!prefs) return false;
    const parsed = JSON.parse(prefs);
    return parsed.notificationsEnabled === true;
  } catch {
    return false;
  }
}

/** Toggle notification preference */
export function setNotificationEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const prefs = JSON.parse(localStorage.getItem("worldscope_prefs") || "{}");
    prefs.notificationsEnabled = enabled;
    localStorage.setItem("worldscope_prefs", JSON.stringify(prefs));
    window.dispatchEvent(new Event("ws:notifications-change"));
  } catch {
    // ignore
  }
}

/** Subscribe to notification preference changes (same-tab + cross-tab). */
export function subscribeNotificationState(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("ws:notifications-change", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("ws:notifications-change", cb);
    window.removeEventListener("storage", cb);
  };
}
