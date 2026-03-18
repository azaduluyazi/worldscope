export type FeedStatus = "healthy" | "broken" | "degraded" | "timeout" | "rate_limited" | "unknown";

export interface FeedValidationResult {
  status: FeedStatus;
  isValid: boolean;
  httpStatus?: number;
  contentType?: string;
  responseTimeMs?: number;
  error?: string;
}

const SSRF_PATTERNS = [
  /^https?:\/\/127\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/169\.254\./,
  /^https?:\/\/localhost/,
  /^https?:\/\/\[::1\]/,
  /\.internal(\/|$)/,
  /\.local(\/|$)/,
];

const XML_CONTENT_TYPES = [
  "application/xml",
  "text/xml",
  "application/rss+xml",
  "application/atom+xml",
  "application/rdf+xml",
];

export function validateFeedUrl(url: string): void {
  for (const pattern of SSRF_PATTERNS) {
    if (pattern.test(url)) {
      throw new Error(`SSRF: Blocked private/internal URL: ${url}`);
    }
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`Invalid protocol: ${parsed.protocol}`);
  }
}

export function classifyFeedStatus(httpStatus: number, contentType: string): FeedValidationResult {
  if (httpStatus === 408 || httpStatus === 504 || httpStatus === 522 || httpStatus === 524) {
    return { status: "timeout", isValid: false, httpStatus, contentType };
  }

  if (httpStatus === 429) {
    return { status: "rate_limited", isValid: true, httpStatus, contentType };
  }

  if (httpStatus >= 400) {
    return { status: "broken", isValid: false, httpStatus, contentType };
  }

  if (httpStatus >= 200 && httpStatus < 300) {
    const isXml = XML_CONTENT_TYPES.some((t) => contentType.includes(t));
    if (isXml) {
      return { status: "healthy", isValid: true, httpStatus, contentType };
    }
    // 200 but not XML — might be paywall redirect or HTML error page
    return { status: "degraded", isValid: false, httpStatus, contentType };
  }

  return { status: "unknown", isValid: false, httpStatus, contentType };
}

export async function checkFeed(url: string): Promise<FeedValidationResult> {
  validateFeedUrl(url);

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "WorldScope/1.0 Feed Validator" },
      redirect: "follow",
    });
    clearTimeout(timeout);

    const contentType = res.headers.get("content-type") || "";
    const result = classifyFeedStatus(res.status, contentType);
    result.responseTimeMs = Date.now() - start;
    return result;
  } catch (err) {
    return {
      status: "timeout",
      isValid: false,
      responseTimeMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function bulkValidate(
  urls: string[],
  concurrency = 10
): Promise<Map<string, FeedValidationResult>> {
  const results = new Map<string, FeedValidationResult>();
  const queue = [...urls];

  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift()!;
      results.set(url, await checkFeed(url));
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}
