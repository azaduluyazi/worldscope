import { streamText } from "ai";
import { briefModel } from "@/lib/ai/providers";
import { cachedFetch } from "@/lib/cache/redis";
import { checkStrictRateLimit } from "@/lib/middleware/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a concise news summarizer. Given an article's title, source, and content, produce a structured summary:

## KEY POINTS
- 3-4 bullet points capturing the essential facts

## CONTEXT
1-2 sentences of background context

## IMPACT
1 sentence on why this matters

Keep total response under 150 words. Be factual, not editorialized.`;

/**
 * POST /api/ai/summarize
 * Summarizes a news article using Groq LLM.
 * Accepts: { url, title, content, lang? }
 * Streams the response for fast UX.
 * Caches summaries by URL for 1 hour.
 */
export async function POST(request: Request) {
  const rl = await checkStrictRateLimit(request);
  if (rl) return rl;
  try {
    const body = await request.json();
    const { url, title, content, lang } = body as {
      url?: string;
      title?: string;
      content?: string;
      lang?: string;
    };

    if (!title && !content) {
      return new Response(JSON.stringify({ error: "title or content required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check cache first
    if (url) {
      const cacheKey = `summary:${Buffer.from(url).toString("base64url").slice(0, 60)}`;
      const cached = await cachedFetch<string | null>(
        cacheKey,
        async () => null, // Don't fetch on miss — we'll stream instead
        3600
      );
      if (cached) {
        return new Response(JSON.stringify({ summary: cached, cached: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (!briefModel) {
      return new Response(JSON.stringify({ error: "No AI provider configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const articleText = [
      title ? `Title: ${title}` : "",
      content ? `Content: ${content.slice(0, 3000)}` : "",
    ].filter(Boolean).join("\n\n");

    const systemPrompt = lang === "tr"
      ? SYSTEM_PROMPT.replace("KEY POINTS", "ANA NOKTALAR")
          .replace("CONTEXT", "BAĞLAM")
          .replace("IMPACT", "ETKİ")
          .replace("bullet points capturing the essential facts", "temel gerçekleri yakalayan madde")
          .replace("background context", "arka plan bağlamı")
          .replace("why this matters", "bunun neden önemli olduğu")
          .replace("Be factual, not editorialized", "Olgusal ol, yorum katma")
          .replace("150 words", "150 kelime")
      : SYSTEM_PROMPT;

    const result = streamText({
      model: briefModel,
      system: systemPrompt,
      prompt: articleText,
      temperature: 0.3,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[ai/summarize]", err);
    return new Response(JSON.stringify({ error: "Summarization failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
