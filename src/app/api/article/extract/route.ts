import { NextRequest, NextResponse } from "next/server";
import { extract } from "@extractus/article-extractor";
import { cachedFetch, TTL } from "@/lib/cache/redis";

export const runtime = "nodejs";
export const maxDuration = 15;

/**
 * POST /api/article/extract — Extract article content from a URL.
 *
 * Uses @extractus/article-extractor to pull clean article text.
 * Results cached in Redis for 6 hours.
 *
 * Body: { url: string, lang?: string }
 * Response: { title, content, description, image, author, published, source }
 */
export async function POST(request: NextRequest) {
  try {
    const { url, lang } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing required field: url" },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Cache key based on URL + language
    const cacheKey = `article:${Buffer.from(url).toString("base64url").slice(0, 60)}:${lang || "en"}`;

    const result = await cachedFetch(
      cacheKey,
      async () => {
        try {
          const article = await extract(url);

          if (!article) return null;

          let content = article.content || "";

          // If target language is not English and content exists, translate it
          if (lang && lang !== "en" && content) {
            try {
              // Translate just the text content (strip HTML, translate, return)
              const plainText = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
              const truncated = plainText.slice(0, 2000); // Limit for translation

              const translateRes = await fetch(
                `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/translate`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    text: [truncated],
                    target: lang,
                    source: "en",
                  }),
                }
              );

              if (translateRes.ok) {
                const { translations } = await translateRes.json();
                if (translations?.[0]) {
                  // Wrap translated text in paragraphs
                  content = translations[0]
                    .split(". ")
                    .map((s: string) => `<p>${s.trim()}.</p>`)
                    .join("");
                }
              }
            } catch {
              // Translation failed, use original content
            }
          }

          return {
            title: article.title || null,
            content,
            description: article.description || null,
            image: article.image || null,
            author: article.author || null,
            published: article.published || null,
            source: article.source || null,
          };
        } catch {
          return null;
        }
      },
      TTL.NEWS * 36 // 6 hours (600s * 36 = 21600s)
    );

    if (!result) {
      return NextResponse.json(
        { error: "Could not extract article content" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Article extraction failed" },
      { status: 500 }
    );
  }
}
