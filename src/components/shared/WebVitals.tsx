"use client";

import { useReportWebVitals } from "next/web-vitals";
import { reportWebVitals } from "@/lib/vitals";

/**
 * Web Vitals reporter component.
 * Place once in the root layout to track Core Web Vitals.
 */
export function WebVitals() {
  useReportWebVitals(reportWebVitals);
  return null;
}
