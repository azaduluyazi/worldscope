/**
 * Web Push Notification Helper
 * Uses the browser Notification API directly (no service worker required).
 */

type NotificationPermissionState = "granted" | "denied" | "default";

/** Check if the Notification API is available in this browser */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Get the current notification permission state */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission as NotificationPermissionState;
}

/** Request permission to show browser notifications */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

/** Send a browser push notification */
export function sendPushNotification(
  title: string,
  body: string,
  options?: { icon?: string; tag?: string; url?: string }
): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;

  const notification = new Notification(title, {
    body,
    icon: options?.icon || "/favicon.ico",
    tag: options?.tag,
  });

  if (options?.url) {
    notification.onclick = () => {
      window.focus();
      window.location.href = options.url!;
    };
  }
}
