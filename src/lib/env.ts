/**
 * Environment variable validation.
 * Validates required env vars at build/startup time.
 * Missing critical vars log warnings but don't crash — graceful degradation.
 */

interface EnvVar {
  key: string;
  required: boolean;
  description: string;
}

const ENV_VARS: EnvVar[] = [
  // Core
  { key: "NEXT_PUBLIC_SUPABASE_URL", required: true, description: "Supabase project URL" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true, description: "Supabase anonymous key" },
  { key: "NEXT_PUBLIC_MAPBOX_TOKEN", required: true, description: "Mapbox GL access token" },
  { key: "NEXT_PUBLIC_SITE_URL", required: false, description: "Public site URL for SEO" },

  // AI
  { key: "GROQ_API_KEY", required: false, description: "Groq API key for AI features" },

  // Cache
  { key: "UPSTASH_REDIS_REST_URL", required: false, description: "Upstash Redis URL" },
  { key: "UPSTASH_REDIS_REST_TOKEN", required: false, description: "Upstash Redis token" },

  // Ads
  { key: "NEXT_PUBLIC_ADSENSE_PUB_ID", required: false, description: "Google AdSense publisher ID" },
  { key: "NEXT_PUBLIC_CARBON_SERVE", required: false, description: "Carbon Ads serve code" },
  { key: "NEXT_PUBLIC_CARBON_PLACEMENT", required: false, description: "Carbon Ads placement" },

  // External APIs
  { key: "NEWSAPI_KEY", required: false, description: "NewsAPI.org API key" },
  { key: "GNEWS_API_KEY", required: false, description: "GNews API key" },
];

export interface EnvValidation {
  valid: boolean;
  missing: string[];
  warnings: string[];
  configured: string[];
}

/**
 * Validate environment variables.
 * Returns status of all env vars — missing required ones make valid=false.
 */
export function validateEnv(): EnvValidation {
  const missing: string[] = [];
  const warnings: string[] = [];
  const configured: string[] = [];

  for (const v of ENV_VARS) {
    const value = process.env[v.key];
    if (value) {
      configured.push(v.key);
    } else if (v.required) {
      missing.push(`${v.key} — ${v.description}`);
    } else {
      warnings.push(`${v.key} not set — ${v.description} (optional)`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
    configured,
  };
}

/**
 * Log env validation results — call at startup.
 */
export function logEnvStatus(): void {
  const result = validateEnv();

  if (result.missing.length > 0) {
    console.warn(
      `\n⚠ WorldScope: Missing required env vars:\n${result.missing.map((m) => `  • ${m}`).join("\n")}\n`
    );
  }

  if (result.warnings.length > 0 && process.env.NODE_ENV === "development") {
    console.info(
      `ℹ WorldScope: Optional env vars not set:\n${result.warnings.map((w) => `  • ${w}`).join("\n")}`
    );
  }

  console.info(
    `✓ WorldScope: ${result.configured.length}/${ENV_VARS.length} env vars configured`
  );
}
