import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * POST /api/indexnow
 *
 * Pushes new/updated URLs to the IndexNow protocol — Bing, Yandex,
 * Naver, Seznam and Brave consume this in real time. Free, no auth
 * beyond the host-key file at /<key>.txt.
 *
 * Body: { urls: string[] }            — push these URLs
 * Body: { url: string }               — single-URL convenience
 * Body: { auto: "briefing"|"sitemap" } — predefined batches
 *
 * Auth: Bearer CRON_SECRET (optional — also accepts no auth for ad-hoc)
 */

const HOST = "troiamedia.com";
const KEY = "f306efb05c373bd09dfb40d8abf07de7";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/IndexNow";

const PRESETS: Record<string, string[]> = {
  briefing: [
    `https://${HOST}/`,
    `https://${HOST}/briefing`,
    `https://${HOST}/newsletter/sample`,
    `https://${HOST}/editorial-policy`,
    `https://${HOST}/corrections`,
    `https://${HOST}/ownership`,
    `https://${HOST}/embed/globe`,
  ],
  sitemap: [
    `https://${HOST}/sitemap.xml`,
    `https://${HOST}/sitemap-news.xml`,
  ],
  variants: [
    `https://${HOST}/conflict`,
    `https://${HOST}/cyber`,
    `https://${HOST}/finance`,
    `https://${HOST}/weather`,
    `https://${HOST}/health`,
    `https://${HOST}/energy`,
    `https://${HOST}/commodity`,
    `https://${HOST}/sports`,
    `https://${HOST}/happy`,
  ],
};

interface Body {
  urls?: string[];
  url?: string;
  auto?: keyof typeof PRESETS;
}

export async function POST(request: NextRequest) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch (err) {
    console.error("[indexnow]", err);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let urlList: string[] = [];
  if (body.auto && PRESETS[body.auto]) {
    urlList = PRESETS[body.auto];
  } else if (body.urls && Array.isArray(body.urls)) {
    urlList = body.urls;
  } else if (body.url) {
    urlList = [body.url];
  }

  if (urlList.length === 0) {
    return NextResponse.json(
      { error: "Provide urls[], url, or auto preset" },
      { status: 400 },
    );
  }

  // IndexNow batch limit is 10,000 URLs per request
  urlList = urlList.slice(0, 10_000);

  // Validate all URLs are on our host
  const invalid = urlList.find((u) => !u.startsWith(`https://${HOST}`));
  if (invalid) {
    return NextResponse.json(
      { error: `URL not on host: ${invalid}` },
      { status: 400 },
    );
  }

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      submitted: urlList.length,
      urls: urlList,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/indexnow — returns the active key + endpoint config (debug)
 */
export async function GET() {
  return NextResponse.json({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    endpoint: ENDPOINT,
    presets: Object.keys(PRESETS),
  });
}
