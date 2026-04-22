import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { RATE_LIMIT_PREFIXES } from "@/lib/cache/keys";

const redis = Redis.fromEnv();

const limiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
  prefix: RATE_LIMIT_PREFIXES.standard,
});

const strictLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: RATE_LIMIT_PREFIXES.strict,
});

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
}

function limited(limit: number, remaining: number, reset: number): NextResponse {
  return NextResponse.json(
    { error: "Rate limit exceeded" },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
      },
    }
  );
}

export async function checkRateLimit(req: Request): Promise<NextResponse | null> {
  const { success, limit, remaining, reset } = await limiter.limit(clientIp(req));
  return success ? null : limited(limit, remaining, reset);
}

/** Stricter 10 req/min limit for abuse-prone endpoints (subscribe, checkout, chat). */
export async function checkStrictRateLimit(req: Request): Promise<NextResponse | null> {
  const { success, limit, remaining, reset } = await strictLimiter.limit(clientIp(req));
  return success ? null : limited(limit, remaining, reset);
}
