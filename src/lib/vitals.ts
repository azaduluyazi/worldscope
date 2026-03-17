/** Web Vitals metric shape (matches next/web-vitals Metric type) */
interface WebVitalMetric {
  name: string;
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
  id: string;
}

/**
 * Report Web Vitals to console + analytics endpoint.
 * Tracks: CLS, FCP, FID, INP, LCP, TTFB.
 *
 * In production, this sends to /api/vitals for monitoring.
 * In development, it logs to console with color coding.
 */
export function reportWebVitals(metric: WebVitalMetric) {
  const { name, value, rating } = metric;

  // Development: color-coded console logging
  if (process.env.NODE_ENV === "development") {
    const color =
      rating === "good" ? "#00ff88" : rating === "needs-improvement" ? "#ffd000" : "#ff4757";

    console.log(
      `%c[Vitals] ${name}: ${Math.round(value)}ms (${rating})`,
      `color: ${color}; font-weight: bold; font-family: monospace;`
    );
    return;
  }

  // Production: send to analytics (non-blocking)
  if (typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(
      "/api/vitals",
      JSON.stringify({
        name,
        value: Math.round(value),
        rating,
        path: window.location.pathname,
        timestamp: Date.now(),
      })
    );
  }
}
