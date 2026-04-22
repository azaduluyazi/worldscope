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
    // SW registration lives in layout.tsx (hostname-gated, lazyOnload) —
    // duplicating here would be redundant.
  }, []);

  return null;
}
