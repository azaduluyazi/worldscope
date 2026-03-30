"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY_EMAIL = "ws_premium_email";
const STORAGE_KEY_UNTIL = "ws_premium_until";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const POLL_INTERVAL_MS = 5000; // 5 seconds
const POLL_MAX_MS = 60000; // 60 seconds max wait

interface SubscriptionState {
  /** Whether the user has an active premium subscription */
  isPremium: boolean;
  /** The premium email if known */
  email: string | null;
  /** Whether the subscription check is still loading */
  isLoading: boolean;
  /** Whether we're waiting for Paddle webhook confirmation */
  isWaitingForWebhook: boolean;
  /**
   * After Paddle checkout success, polls the API until webhook confirms premium.
   * Returns true if confirmed within 60s, false if timed out.
   */
  waitForWebhook: (email: string) => Promise<boolean>;
  /**
   * Instantly check and unlock — used for "Restore subscription" flow
   * where user already has an active subscription.
   */
  restore: (email: string) => Promise<boolean>;
  /** Clear premium status */
  logout: () => void;
}

/**
 * Client-side premium subscription hook.
 *
 * Uses localStorage to cache premium status for 24h.
 * No login required — email-based verification only.
 *
 * Two unlock flows:
 * 1. waitForWebhook(email) — after Paddle checkout, polls API every 5s
 *    until webhook confirms tier='premium' (max 60s)
 * 2. restore(email) — instant check for returning subscribers
 */
export function useSubscription(): SubscriptionState {
  const [isPremium, setIsPremium] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWaitingForWebhook, setIsWaitingForWebhook] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Check cached status on mount
  useEffect(() => {
    const cachedEmail = localStorage.getItem(STORAGE_KEY_EMAIL);
    const cachedUntil = localStorage.getItem(STORAGE_KEY_UNTIL);

    if (cachedEmail && cachedUntil) {
      const until = parseInt(cachedUntil, 10);
      if (Date.now() < until) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsPremium(true);
        setEmail(cachedEmail);
        setIsLoading(false);
        return;
      }
      // Cache expired — re-verify
      verifyEmail(cachedEmail).then((result) => {
        setIsPremium(result);
        setEmail(result ? cachedEmail : null);
        if (!result) {
          localStorage.removeItem(STORAGE_KEY_EMAIL);
          localStorage.removeItem(STORAGE_KEY_UNTIL);
        }
        setIsLoading(false);
      });
      return;
    }

    setIsLoading(false);
  }, []);

  const savePremium = useCallback((premiumEmail: string) => {
    const normalized = premiumEmail.toLowerCase();
    localStorage.setItem(STORAGE_KEY_EMAIL, normalized);
    localStorage.setItem(STORAGE_KEY_UNTIL, String(Date.now() + CACHE_TTL_MS));
    setIsPremium(true);
    setEmail(normalized);
  }, []);

  /**
   * Poll API every 5s until Paddle webhook confirms premium status.
   * Max wait: 60s. Used after Paddle checkout completes.
   */
  const waitForWebhook = useCallback(
    (checkEmail: string): Promise<boolean> => {
      setIsWaitingForWebhook(true);
      const startTime = Date.now();

      return new Promise((resolve) => {
        const poll = async () => {
          const verified = await verifyEmail(checkEmail);
          if (verified) {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            savePremium(checkEmail);
            setIsWaitingForWebhook(false);
            resolve(true);
            return;
          }
          if (Date.now() - startTime > POLL_MAX_MS) {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setIsWaitingForWebhook(false);
            resolve(false);
          }
        };

        // First check immediately
        poll();
        // Then poll every 5 seconds
        pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
      });
    },
    [savePremium]
  );

  /** Instant check — for "Restore subscription" flow */
  const restore = useCallback(
    async (restoreEmail: string): Promise<boolean> => {
      const verified = await verifyEmail(restoreEmail);
      if (verified) {
        savePremium(restoreEmail);
      }
      return verified;
    },
    [savePremium]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_EMAIL);
    localStorage.removeItem(STORAGE_KEY_UNTIL);
    setIsPremium(false);
    setEmail(null);
  }, []);

  return {
    isPremium,
    email,
    isLoading,
    isWaitingForWebhook,
    waitForWebhook,
    restore,
    logout,
  };
}

async function verifyEmail(email: string): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/subscription/check?email=${encodeURIComponent(email)}`
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data.isPremium === true;
  } catch {
    return false;
  }
}
