/**
 * BYOK AI — Bring Your Own Key
 * Allows users to use their own AI API keys for generating briefs.
 * Keys are stored in localStorage only (never sent to our server).
 */

export type AIProvider = "groq" | "openai" | "anthropic";

export interface BYOKConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

const STORAGE_KEY = "worldscope_byok";

export const PROVIDER_MODELS: Record<AIProvider, { name: string; defaultModel: string; models: string[] }> = {
  groq: {
    name: "Groq",
    defaultModel: "llama-3.3-70b-versatile",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
  },
  openai: {
    name: "OpenAI",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  },
  anthropic: {
    name: "Anthropic",
    defaultModel: "claude-sonnet-4-20250514",
    models: ["claude-sonnet-4-20250514", "claude-haiku-4-5-20251001"],
  },
};

export function getBYOKConfig(): BYOKConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const config = JSON.parse(stored);
    if (!config.provider || !config.apiKey) return null;
    return config;
  } catch {
    return null;
  }
}

export function setBYOKConfig(config: BYOKConfig | null): void {
  if (typeof window === "undefined") return;
  if (!config) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }
}

export function hasBYOK(): boolean {
  return getBYOKConfig() !== null;
}

/**
 * Generate AI text using user's own API key (client-side call).
 * The API key never touches our server — requests go directly to the provider.
 */
export async function generateWithBYOK(
  config: BYOKConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const model = config.model || PROVIDER_MODELS[config.provider].defaultModel;

  switch (config.provider) {
    case "groq": {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "No response generated.";
    }

    case "openai": {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "No response generated.";
    }

    case "anthropic": {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": config.apiKey,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1500,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      const data = await res.json();
      return data.content?.[0]?.text || "No response generated.";
    }

    default:
      return "Unknown provider.";
  }
}
