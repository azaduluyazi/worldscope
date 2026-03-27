/**
 * Lighthouse CI Configuration
 * Runs performance/accessibility/SEO audits on every PR.
 * Thresholds based on current scores + improvement targets.
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run build && npm run start",
      startServerReadyPattern: "Ready in",
      startServerReadyTimeout: 60000,
      url: ["http://localhost:3000"],
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
        // Skip heavy audits that timeout on CI
        skipAudits: ["uses-http2"],
      },
    },
    assert: {
      assertions: {
        // Performance — current: 36, target: 50+
        "categories:performance": ["warn", { minScore: 0.4 }],
        // Accessibility — current: 93, keep above 90
        "categories:accessibility": ["error", { minScore: 0.9 }],
        // Best Practices — current: 73, target: 80+
        "categories:best-practices": ["warn", { minScore: 0.7 }],
        // SEO — current: 100, keep perfect
        "categories:seo": ["error", { minScore: 0.95 }],
        // Core Web Vitals
        "largest-contentful-paint": ["warn", { maxNumericValue: 5000 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 1000 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
