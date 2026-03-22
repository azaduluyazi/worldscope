import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface ProviderStatus {
  name: string;
  provider: string;
  configured: boolean;
  healthy: boolean | null;
  lastCheck: string | null;
  error?: string;
}

/**
 * GET /api/ai/health
 * Check health of all configured LLM providers.
 */
export async function GET() {
  const providers: ProviderStatus[] = [];

  // Check Groq
  if (process.env.GROQ_API_KEY) {
    const status = await checkProvider("Groq Llama 3.3", "groq", async () => {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    });
    providers.push(status);
  } else {
    providers.push({ name: "Groq Llama 3.3", provider: "groq", configured: false, healthy: null, lastCheck: null });
  }

  // Check OpenAI
  if (process.env.OPENAI_API_KEY) {
    const status = await checkProvider("GPT-4o-mini", "openai", async () => {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    });
    providers.push(status);
  } else {
    providers.push({ name: "GPT-4o-mini", provider: "openai", configured: false, healthy: null, lastCheck: null });
  }

  // Check Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    const status = await checkProvider("Claude Haiku", "anthropic", async () => {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 5, messages: [{ role: "user", content: "ping" }] }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    });
    providers.push(status);
  } else {
    providers.push({ name: "Claude Haiku", provider: "anthropic", configured: false, healthy: null, lastCheck: null });
  }

  const activeProvider = providers.find((p) => p.configured && p.healthy === true)?.name
    || providers.find((p) => p.configured)?.name
    || "none";

  return NextResponse.json({
    providers,
    activeProvider,
    totalConfigured: providers.filter((p) => p.configured).length,
    totalHealthy: providers.filter((p) => p.healthy === true).length,
    timestamp: new Date().toISOString(),
  });
}

async function checkProvider(
  name: string,
  provider: string,
  healthCheck: () => Promise<void>
): Promise<ProviderStatus> {
  try {
    await healthCheck();
    return { name, provider, configured: true, healthy: true, lastCheck: new Date().toISOString() };
  } catch (e) {
    return {
      name,
      provider,
      configured: true,
      healthy: false,
      lastCheck: new Date().toISOString(),
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
