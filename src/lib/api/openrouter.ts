/**
 * OpenRouter — AI Model Fallback (OpenAI-compatible)
 * Used when Groq rate limit is hit.
 * https://openrouter.ai/docs
 */

import { gatewayFetch } from "@/lib/api/gateway";

interface OpenRouterMessage {
  role: string;
  content: string;
}

interface OpenRouterChoice {
  message: { role: string; content: string };
  finish_reason: string;
}

const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.0-flash-exp:free";

/** Call OpenRouter chat completions as AI fallback */
export async function callOpenRouter(
  messages: OpenRouterMessage[],
  model: string = DEFAULT_MODEL
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return "";

  return gatewayFetch(
    "openrouter",
    async () => {
      const res = await fetch(OPENROUTER_BASE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://troiamedia.com",
          "X-Title": "WorldScope",
        },
        body: JSON.stringify({ model, messages }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) return "";

      const json = await res.json();
      const choices: OpenRouterChoice[] = json?.choices || [];
      return choices[0]?.message?.content || "";
    },
    { timeoutMs: 30000, fallback: "" }
  );
}
