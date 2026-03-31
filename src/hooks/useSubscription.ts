"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY_EMAIL = "ws_newsletter_email";

function getInitialEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY_EMAIL);
}

interface NewsletterState {
  /** Whether the user is subscribed to the newsletter */
  isSubscribed: boolean;
  /** The subscriber email if known */
  email: string | null;
  /** Subscribe with email */
  subscribe: (email: string) => Promise<boolean>;
  /** Clear subscription status */
  logout: () => void;
}

/**
 * Client-side newsletter subscription hook.
 * Uses localStorage to remember subscription email.
 * No payment — everything is free.
 */
export function useSubscription(): NewsletterState {
  const [email, setEmail] = useState<string | null>(getInitialEmail);

  const subscribe = useCallback(async (subEmail: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subEmail.toLowerCase(), frequency: "daily" }),
      });
      if (!res.ok) return false;
      const normalized = subEmail.toLowerCase();
      localStorage.setItem(STORAGE_KEY_EMAIL, normalized);
      setEmail(normalized);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_EMAIL);
    setEmail(null);
  }, []);

  return {
    isSubscribed: !!email,
    email,
    subscribe,
    logout,
  };
}
