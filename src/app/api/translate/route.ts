import { NextRequest, NextResponse } from "next/server";
import { cachedFetch, TTL } from "@/lib/cache/redis";
import { locales } from "@/i18n/config";

export const runtime = "edge";

/**
 * POST /api/translate — Translate text to target language.
 *
 * Uses LibreTranslate (free, open-source) or falls back to MyMemory API.
 * Results are cached in Redis for 24 hours to minimize API calls.
 *
 * Body: { text: string | string[], target: string, source?: string }
 * Response: { translations: string[] }
 */

const LIBRE_TRANSLATE_URL =
  process.env.LIBRE_TRANSLATE_URL || "https://libretranslate.com/translate";

const MYMEMORY_URL = "https://api.mymemory.translated.net/get";

/** Translate a single text via LibreTranslate */
async function translateLibre(
  text: string,
  target: string,
  source: string
): Promise<string | null> {
  try {
    const res = await fetch(LIBRE_TRANSLATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source,
        target,
        format: "text",
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.translatedText || null;
  } catch {
    return null;
  }
}

/** Fallback: translate via MyMemory API (1000 words/day free) */
async function translateMyMemory(
  text: string,
  target: string,
  source: string
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      q: text.slice(0, 500), // MyMemory limit
      langpair: `${source}|${target}`,
    });
    const res = await fetch(`${MYMEMORY_URL}?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.responseData?.translatedText || null;
  } catch {
    return null;
  }
}

/** Translate with fallback chain: LibreTranslate → MyMemory → original */
async function translateText(
  text: string,
  target: string,
  source: string
): Promise<string> {
  if (!text.trim() || source === target) return text;

  // Try LibreTranslate first
  const libre = await translateLibre(text, target, source);
  if (libre) return libre;

  // Fallback to MyMemory
  const myMemory = await translateMyMemory(text, target, source);
  if (myMemory) return myMemory;

  // Return original if all fail
  return text;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, target, source = "en" } = body;

    if (!text || !target) {
      return NextResponse.json(
        { error: "Missing required fields: text, target" },
        { status: 400 }
      );
    }

    // Validate target locale
    if (!locales.includes(target)) {
      return NextResponse.json(
        { error: `Unsupported target locale: ${target}` },
        { status: 400 }
      );
    }

    // Handle batch translation (array of texts)
    const texts: string[] = Array.isArray(text) ? text : [text];

    if (texts.length > 50) {
      return NextResponse.json(
        { error: "Max 50 texts per request" },
        { status: 400 }
      );
    }

    // Translate with Redis caching (24h TTL)
    const translations = await Promise.all(
      texts.map((t) =>
        cachedFetch<string>(
          `translate:${target}:${Buffer.from(t).toString("base64url").slice(0, 60)}`,
          () => translateText(t, target, source),
          TTL.AI_BRIEF // 1 hour cache (3600s)
        )
      )
    );

    return NextResponse.json({ translations });
  } catch {
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
