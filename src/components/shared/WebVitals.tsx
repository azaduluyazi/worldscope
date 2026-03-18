"use client";

import { useEffect } from "react";
import { useReportWebVitals } from "next/web-vitals";
import { reportWebVitals } from "@/lib/vitals";
import { installErrorHandlers } from "@/lib/error-tracking";

/**
 * Web Vitals + Error tracking component.
 * Place once in the root layout to track Core Web Vitals
 * and capture unhandled errors.
 */
export function WebVitals() {
  useReportWebVitals(reportWebVitals);

  useEffect(() => {
    installErrorHandlers();

    // Register Service Worker for PWA offline support
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration failed — non-critical, app works without it
      });
    }
  }, []);

  return null;
}
